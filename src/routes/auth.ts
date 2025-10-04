import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { LoginRequestBody } from "types/auth";
import { hashEmail, comparePasswords } from "utils/crypto/hash";
import {
  createJWTForAccount,
  createRefreshToken,
  validateRefreshToken,
} from "utils/jwt/jwt";

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

        const token = createJWTForAccount(account.id);
        const refreshToken = await createRefreshToken(prisma, account.id);

        // Set refresh token in a cookie

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ token, refreshToken });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/refresh",
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
          return res.status(401).json({ error: "Refresh token not found" });
        }

        const { newRefreshToken, accountId } = await validateRefreshToken(
          prisma,
          refreshToken
        );

        const token = createJWTForAccount(accountId);

        const newToken = res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ token, refreshToken: newToken });
      } catch (error) {
        res.clearCookie("refreshToken");
        next(error);
      }
    }
  );

  return router;
};
