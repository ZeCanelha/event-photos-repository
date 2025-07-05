import { Role } from "@prisma/client";
import { z } from "zod";
import { Request, ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  eventId: z.string().optional(),
});

export interface JWTClains {
  iat: number;
  exp: number;
  jti: string;
  role: Role;
  eventUserId: string;
  eventId: string;
  accountId: string;
}

export interface IGetUserAuthInfoRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: JWTClains;
}

export type LoginRequestBody = z.infer<typeof loginSchema>;
