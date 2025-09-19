import { Worker, Job, JobProgress } from "bullmq";
import { redis } from "lib/redis";
import { rm } from "fs/promises";
import fs from "fs";
import path from "path";
import { processImage } from "utils/image";
import prisma from "utils/prisma";
import { ProcessImageJobData } from "types/jobs";
import { imageUploadQueue } from "queues/queue";

console.log("Starting image processing worker");

const IMAGE_PROCESSING_QUEUE = "imageProcessing";

const UPLOAD_QUEUE = "imageUpload";

// Map eventID watermark in cache to improve db hits

const eventWawtermarkCache = new Map<string, string>();

const isEventWatermarkCached = async (eventId: string) => {
  if (eventWawtermarkCache.has(eventId))
    return eventWawtermarkCache.get(eventId);

  const event = await prisma.events.findUnique({
    where: {
      id: eventId,
    },
  });
  if (!event) throw new Error("Event not found");

  eventWawtermarkCache.set(eventId, event.eventWatermark);

  return event.eventWatermark;
};

const resizeJob = async (job: Job) => {
  const jobData = job.data as ProcessImageJobData;
  console.log(`Started image processing for event ${jobData.eventId}`);

  if (!jobData.eventId) throw new Error(`Event Id not found in job data`);

  const watermarkPath = await isEventWatermarkCached(jobData.eventId);

  console.log(`Reading watermark from ${watermarkPath}`);

  const outputPath = path.resolve(
    process.cwd(),
    "temp",
    `${jobData.eventId}`,
    `${new Date().toISOString()}.webp`
  );

  const watermarkedImage = await processImage(
    jobData.filePath,
    outputPath,
    watermarkPath
  );

  // increment progress on redis instead of jobNumber tracking. It will not be ordered because of concurrency set

  const jobsDone = await redis.hincrby(
    `events:${jobData.eventId}`,
    "jobs_done",
    1
  );

  // always keep totalJobs up to date
  await redis.hset(
    `events:${jobData.eventId}`,
    "jobs_total",
    jobData.totalJobs
  );

  // Update event job status on redis
  await redis.publish(
    `events:${jobData.eventId}:updates`,
    JSON.stringify({
      event: jobData.eventId,
      jobsDone,
      jobsTotal: jobData.totalJobs,
      status:
        jobsDone === jobData.totalJobs ? "processing_completed" : "processing",
      worker: "image",
    })
  );

  await imageUploadQueue.add("upload-image", {
    eventId: jobData.eventId,
    filePath: watermarkedImage,
  });
};

const worker = new Worker(IMAGE_PROCESSING_QUEUE, resizeJob, {
  connection: redis,
  concurrency: 5,
});

//TODO: Extend a job type

worker.on("completed", async (job: Job, returnvalue: any) => {
  const jobData = job.data as ProcessImageJobData;

  if (fs.existsSync(path.resolve(process.cwd(), job.data.filePath))) {
    console.log(`Cleaning reseources on: ${job.data.filePath}`);
    await rm(jobData.filePath);
  }
  console.log(`Finished job ${job.id} for event ${jobData.eventId}`);
});

worker.on("progress", (job: Job, progress: JobProgress) => {
  console.log(`Job on progress test: ${job.id} ${progress}`);
  console.log(
    `Job ${job.data.jobNumber} on progress on a total of ${job.data.totalJobs}`
  );
});
