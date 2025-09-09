import { Queue } from "bullmq";
import { redis } from "lib/redis";

export const imageProcessingQueue = new Queue("imageProcessing", {
  connection: redis,
});

export const imageUploadQueue = new Queue("imageUpload", { connection: redis });
