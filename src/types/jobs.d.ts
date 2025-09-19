import { Job, JobData } from "bullmq";

export interface ProcessImageJobData extends JobData {
  eventId: string;
  filePath: string;
  originalName: string;
  totalJobs: number;
}

export interface UploadImageJobData extends JobData {
  eventId: string;
  filePath: string;
}
