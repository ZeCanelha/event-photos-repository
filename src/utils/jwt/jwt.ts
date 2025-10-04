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

export const createJWTForAccount = (accountId: string) => {
  if (!accountId) throw new Error("Invalid account or role");

  const claims = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // 2 dias
    jti: crypto.randomUUID(),

    accountId: accountId,
  };

  const token = jwt.sign(claims, process.env.JWT_SECRET as Secret);

  return token;
};

export const createRefreshToken = async (
  client: PrismaClient,
  accountId: string
) => {
  const refreshToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await client.refreshToken.create({
    data: {
      tokenHash,
      accountId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return refreshToken;
};

export const validateRefreshToken = async (
  client: PrismaClient,
  token: string
) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const oldToken = await client.refreshToken.findUnique({
    where: { tokenHash },
    include: { account: true },
  });

  if (!oldToken || oldToken.expiresAt < new Date() || oldToken.revoked) {
    throw new Error("Invalid token");
  }

  const newRefreshToken = crypto.randomBytes(32).toString("hex");
  const newTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const newToken = await client.refreshToken.create({
    data: {
      tokenHash: newTokenHash,
      accountId: oldToken.accountId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Revoke old token

  await client.refreshToken.update({
    where: { id: oldToken.id },
    data: {
      revoked: true,
      revokedAt: new Date(),
      replacedBy: newToken.id,
    },
  });

  return { newRefreshToken, accountId: oldToken.accountId };
};
