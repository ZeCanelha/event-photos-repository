import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import { createJWTForAccount } from "utils/jwt/jwt";
import { validateBody } from "middleware/validation";
import { token } from "morgan";
import { CreateUserRequestBody, createuserSchema } from "types/account";
import { encryptData } from "utils/crypto/crypto";
import { hashEmail } from "utils/crypto/hash";

export const accountRouter = (prisma: PrismaClient) => {
  const router = Router();

  router.post(
    "/register",
    validateBody(createuserSchema),
    async (
      req: Request<{}, {}, CreateUserRequestBody>,
      res: Response,
      next: NextFunction
    ): Promise<any> => {
      try {
        const { email, inviteId, username, password, role } = req.body;
        const hashedEmail = await hashEmail(email);

        const account = await prisma.account.findUnique({
          where: {
            emailHash: hashedEmail,
          },
        });

        if (account == null)
          return res.status(400).json({ error: "Account already registered" });

        const invite = await prisma.eventInvitation.findUnique({
          where: {
            id: inviteId,
          },
        });

        if (invite == null)
          return res.status(404).json({ error: "Invite not found" });

        if (
          invite.expiresIn.getTime() < Date.now() ||
          invite.inviteStatus === "accepted"
        ) {
          return res.status(400).json({ error: "Invite expired" });
        }

        const event = await prisma.events.findUnique({
          where: {
            id: invite.eventId,
          },
        });

        if (event == null)
          return res.status(404).json({ error: "Event not found" });

        // For now i'll encrypt here the sensitive data

        const newAccount = await prisma.account.create({
          data: {
            emailHash: hashedEmail,
            password: password,
            email: encryptData(email),
          },
        });

        // Create EventUser ...

        const eventUser = await prisma.eventUsers.create({
          data: {
            eventId: invite.eventId,
            accountId: newAccount.id,
          },
        });

        return res.status(200).json({
          token: createJWTForAccount(role, newAccount),
          email: email,
          accountId: account.id,
          eventUserId: eventUser.id,
          event: event.id,
        });
      } catch (error: any) {
        next(error);
      }
    }
  );

  return router;
};
