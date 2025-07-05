import { Account, PrismaClient } from "@prisma/client";
import jwt, { Secret } from "jsonwebtoken";
import crypto from "crypto";

export const createJWTForEventuser = async (
  client: PrismaClient,
  account: Account,
  eventId: string
) => {
  let event;
  if (eventId) {
    event = await client.events.findUnique({
      where: {
        id: eventId,
      },
    });
  } else {
    event = await client.events.findFirst({
      where: {
        ownerId: account.id,
        active: true,
      },
    });
  }

  if (event == null || !event.active || event.expiresIn.getTime() > Date.now())
    throw new Error("Invalid Event");

  const eventUser = await client.eventUsers.findUnique({
    where: {
      eventId_accountId: {
        accountId: account.id,
        eventId: eventId,
      },
    },
  });
  if (eventUser == null) throw new Error("User has no access to this event");

  const claims = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // 2 dias
    jti: crypto.randomUUID(),

    eventUserId: eventUser.id,
    eventId: event.id,
    accountId: account.id,
  };

  const token = jwt.sign(claims, process.env.JWT_SECRET as Secret);

  return token;
};

export const createJWTForAccount = (accountRole: string, account: Account) => {
  if (!account || !accountRole) throw new Error("Invalid account or role");

  const claims = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // 2 dias
    jti: crypto.randomUUID(),

    role: accountRole,
    accountId: account.id,
  };

  const token = jwt.sign(claims, process.env.JWT_SECRET as Secret);

  return token;
};

export const refreshJWT = () => {};
