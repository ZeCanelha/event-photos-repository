import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { imageProcessingQueue as imageQueue } from "queues/queue";

import multer from "multer";
const uploads = multer({ dest: "uploads/" });

export const mediaRouter = (prisma?: PrismaClient) => {
  const router = Router();

  router.post(
    "/upload",
    uploads.array("images", 10),

    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        if (!req.files)
          return res.status(400).json({ error: "No files found" });

        const files = req.files as Express.Multer.File[];

        let imageIndex = 0;

        for (const file of files) {
          // add each file to a job with metadata to then clean or do some work

          const job = await imageQueue.add("process-image", {
            filePath: file.path,
            originalName: file.originalname,
            totalJobs: files.length,
            jobNumber: imageIndex,
          });

          imageIndex++;
        }
        res.status(200).json({ message: "Files upload with success" });
      } catch (error: any) {
        res.status(500).json({
          error: "Error processing uploaded files",
          reason: error?.message,
        });
      }
    }
  );

  return router;
};
