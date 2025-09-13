import { Worker, Job } from "bullmq";
import { existsSync } from "fs";
import { redis } from "lib/redis";
import path from "path";
import { UploadImageJobData } from "types/jobs";
import prisma from "utils/prisma";

console.log("Starting upload worker");

const UPLOAD_QUEUE = "imageUpload";

const uploadJob = async (job: Job) => {
  const jobData = job.data as UploadImageJobData;
  console.log(`Started image upload for event ${jobData.eventId}`);

  // For mock/current use the final path as the one on disk
  const finalPath = jobData.filePath;

  // Create the new media entry

  try {
    const media = await prisma.eventMidia.create({
      data: {
        filename: jobData.filePath,
        originalUrl: jobData.filePath,
        thumnbnailUrl: jobData.filePath,
        eventId: jobData.eventId,
      },
    });
  } catch (error: any) {
    console.log(`Error processing ${jobData.eventId} ${job.id} `);
    // Do smth like notify error
  }
};

const worker = new Worker(UPLOAD_QUEUE, uploadJob, { connection: redis });

worker.on("completed", async (job: Job) => {
  const data = job.data as UploadImageJobData;

  if (existsSync(path.resolve(process.cwd(), data.filePath))) {
    console.log(`Cleaning disk resources on: ${data.filePath}`);
  }
  // Notify or smth
  console.log(`Finished upload job ${job.id}}`);
});
