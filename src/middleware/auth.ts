import jwt, { Secret, sign } from "jsonwebtoken";
import dotenv from "dotenv";
import { Account, PrismaClient, Role } from "@prisma/client";
import { Response, NextFunction, Request } from "express";
import { IGetUserAuthInfoRequest, JWTClains } from "types/auth";

dotenv.config();

export const validateJWT = (
  req: IGetUserAuthInfoRequest,
  res: Response,
  next: NextFunction
): void => {
  let token = req.header("Authorization");

  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  if (!token.startsWith("Bearer ")) {
    res.status(400).json({ error: "Invalid token format" });
    return;
  }

  token = token.substring(7);

  jwt.verify(token, process.env.JWT_SECRET as Secret, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        res.status(401).json({ error: "Token expired" });
      } else {
        res.status(403).json({ error: "Invalid token" });
      }
      return;
    }

    req.user = decoded as JWTClains;
    next();
  });
};
