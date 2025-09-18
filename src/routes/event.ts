import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { validateJWT } from "middleware/auth";
import { permissions } from "middleware/permission";
import { IGetUserAuthInfoRequest, JWTClaims } from "types/auth";
import {
  CreateEventSchema,
  EventId,
  EventMetadata,
  EventMidia,
  EventSchema,
  ListEventSchema,
} from "types/event";
import { imageProcessingQueue as imageQueue } from "queues/queue";

import multer from "multer";

const uploadWatermark = multer({ dest: "watermarks/" });
const uploads = multer({ dest: "uploads/" });

//TODO: Criar as permissões depois

export const eventRouter = (prisma: PrismaClient) => {
  const router = Router();

  router.post(
    "/",
    validateJWT,
    uploadWatermark.single("watermark"),
    async (
      req: IGetUserAuthInfoRequest<{}, {}, CreateEventSchema>,
      res: Response,
      next: NextFunction
    ): Promise<any> => {
      try {
        const user = req.user as JWTClaims;
        const { eventName, expiresIn, eventDescription, position, blendMode } =
          req.body;

        const file = req.file;

        if (!file)
          return res.status(400).json({ error: "Watermark file not found" });

        const event = await prisma.events.create({
          data: {
            eventName,
            expiresIn: new Date(expiresIn),
            eventDescription,
            ownerId: user.accountId,
            eventWatermark: file.path,
            metadata: {
              position,
              blendMode,
            },
          },
        });

        return res.status(200).json({ eventId: event.id });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/:id/watermark",
    validateJWT,
    uploadWatermark.single("watermark"),
    async (
      req: IGetUserAuthInfoRequest<EventId, {}, EventMetadata>,
      res: Response,
      next: NextFunction
    ): Promise<any> => {
      try {
        const user = req.user as JWTClaims;
        const eventId = req.params.id;
        const metadata = req.body;

        const file = req.file;
        if (!file)
          return res.status(400).json({ error: "Watermark file not found" });
        const event = await prisma.events.findUnique({
          where: {
            id: eventId,
          },
        });

        if (!event) return res.status(404).json({ error: "Event not found" });

        const updatedEvent = await prisma.events.update({
          where: {
            id: eventId,
          },
          data: {
            metadata,
            eventWatermark: req.file?.path,
          },
        });

        return res.status(200).json({
          message: "Event watermark updated successfully",
          id: eventId,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/:id/upload",
    uploads.array("images", 10),
    async (
      req: IGetUserAuthInfoRequest<EventId, {}, {}>,
      res: Response,
      next: NextFunction
    ): Promise<any> => {
      try {
        const eventId = req.params.id;
        const event = await prisma.events.findUnique({
          where: {
            id: eventId,
          },
        });

        if (!event) return res.status(404).json({ error: "Event not found" });

        if (!req.files)
          return res.status(400).json({ error: "No files found" });

        const files = req.files as Express.Multer.File[];

        let imageIndex = 0;

        for (const file of files) {
          // add each file to a job with metadata to then clean or do some work

          const job = await imageQueue.add("process-image", {
            eventId,
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

  router.get(
    "/",
    validateJWT,
    async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
      try {
        const { accountId } = req.user as JWTClaims;

        const events = await prisma.events.findMany({
          where: {
            ownerId: accountId,
          },
        });

        if (events == null) {
          res.status(404).json({ error: "No events found for account" });
          return;
        }

        const eventList: ListEventSchema[] = events.map((e) => {
          return {
            id: e.id,
            active: e.active,
            eventName: e.eventName,
            expiresIn: e.expiresIn,
          };
        });
        res.status(200).json({ events: eventList });
      } catch (error) {
        next(error);
      }
    }
  );
  router.get(
    "/:id",
    validateJWT,
    async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
      try {
        const { accountId } = req.user as JWTClaims;
        const id = req.params.id;

        const event = await prisma.events.findUnique({
          where: {
            id,
          },
          include: {
            eventMidia: true,
          },
        });

        if (event == null) {
          res.status(404).json({ error: "Event not found" });
          return;
        }

        if (event.ownerId !== accountId) {
          const isEventUser = await prisma.eventUsers.findFirst({
            where: {
              eventId: id,
              accountId,
            },
          });

          if (!isEventUser) {
            res.status(403).json({ error: "Access denied" });
          }
        }

        const eventMedia: EventMidia[] = event.eventMidia?.map((e) => {
          return {
            id: e.id,
            url: e.thumnbnailUrl,
            filename: e.filename,
          };
        });

        const eventDTO: EventSchema = {
          active: event.active,
          eventMedia,
          eventName: event.eventName,
          expiresIn: event.expiresIn,
          id: event.id,
        };

        res.status(200).json({ event: eventDTO });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post("/invite", permissions("EventInvitation", "Execute"));

  return router;
};
