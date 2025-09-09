import { Worker, Job, JobProgress } from "bullmq";
import { redis } from "lib/redis";
import { rm } from "fs/promises";
import fs from "fs";
import path from "path";
import { processImage } from "utils/image";
import prisma from "utils/prisma";
import { ProcessImageJobData } from "types/jobs";

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
  console.log(`Started image processing for job ${job.id}`);

  const jobData = job.data as ProcessImageJobData;

  if (!jobData.eventId) throw new Error(`Event Id not found in job data`);

  const watermarkPath = await isEventWatermarkCached(jobData.eventId);

  const outputPath = path.resolve(process.cwd(), "temp", `${job.id}.webp`);
  const watermarkedImage = await processImage(
    jobData.filePath,
    outputPath,
    watermarkPath
  );
};

const worker = new Worker(IMAGE_PROCESSING_QUEUE, resizeJob, {
  connection: redis,
});

//TODO: Extend a job type

worker.on("completed", async (job: Job, returnvalue: any) => {
  console.log(`Job ${job.id} completed`);

  if (fs.existsSync(path.resolve(process.cwd(), job.data.filePath))) {
    console.log(`Cleaning reseources on: ${job.data.filePath}`);
    await rm(job.data.filePath);
  }
});

worker.on("progress", (job: Job, progress: JobProgress) => {
  console.log(`Job on progress test: ${job.id} ${progress}`);
  console.log(
    `Job ${job.data.jobNumber} on progress on a total of ${job.data.totalJobs}`
  );
});
