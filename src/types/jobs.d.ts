import { Job } from "bullmq";

export interface ProcessImageJobData extends Job {
  filePath: string;
  originalName: string;
  eventId: string;
  totalImages?: number;
  currentImages?: number;
}
