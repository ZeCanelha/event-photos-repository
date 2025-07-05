import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { validateJWT } from "middleware/auth";
import { IGetUserAuthInfoRequest, JWTClains } from "types/auth";
import { CreateEventSchema } from "types/event";

export const eventRouter = (prisma: PrismaClient) => {
  const router = Router();

  router.post(
    "/",
    validateJWT,
    async (
      req: IGetUserAuthInfoRequest<{}, {}, CreateEventSchema>,
      res: Response,
      next: NextFunction
    ): Promise<any> => {
      try {
        const user = req.user as JWTClains;
        const { eventName, expiresIn, eventDescription } = req.body;

        const event = await prisma.events.create({
          data: {
            eventName,
            expiresIn,
            eventDescription,
            ownerId: user.accountId,
          },
        });

        return res.status(200).json({ eventId: event.id });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};
