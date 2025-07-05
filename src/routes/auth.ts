import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { LoginRequestBody } from "types/auth";
import { hashEmail, comparePasswords } from "utils/crypto/hash";
import { createJWTForAccount } from "utils/jwt/jwt";

const router = Router();
export const authRouter = (prisma: PrismaClient) => {
  router.post(
    "/login",
    async (
      req: Request<{}, {}, LoginRequestBody>,
      res: Response,
      next: NextFunction
    ): Promise<any> => {
      try {
        const { email, password, eventId } = req.body;

        const hashedEmail = hashEmail(email);
        console.log(hashedEmail);

        const account = await prisma.account.findUnique({
          where: {
            emailHash: hashedEmail,
          },
          include: { accountRole: true },
        });

        if (account == null)
          return res.status(401).json({ error: "Credentials not match" });

        if (!account.active)
          return res.status(401).json({ error: "Deactivated user" });

        const passwordMatching = await comparePasswords(
          password,
          account?.password
        );

        if (!passwordMatching) {
          return res.status(401).json({ error: "Credentials not match" });
        }

        const token = createJWTForAccount(account.accountRole!.name, account);

        return res.status(200).json({ token });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};
