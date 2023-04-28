import db from "@/db-client";
import { encode } from "next-auth/jwt";
import { generateBase64Token } from "./crypto";

/**
 * Flushes the database removing all data.
 * DANGEROUS - USE WITH CAUTION
 */
export const flushDB = async () => {
  await db.$queryRaw`DELETE FROM "Job"`;
  await db.$queryRaw`DELETE FROM "Contract"`;
  await db.$queryRaw`DELETE FROM "Session"`;
  await db.$queryRaw`DELETE FROM "Account"`;
  await db.$queryRaw`DELETE FROM "VerificationToken"`;
  await db.$queryRaw`DELETE FROM "User"`;
  // Using DELETE FROM because using SQLite at the moment
  // TODO: Use TRUNCATE when using PostgreSQL
  // await db.$queryRaw`TRUNCATE "User" CASCADE`;
};

/**
 * Generates a JWT bearer token for a user. Used for testing.
 * @param userId The user ID
 * @returns
 */
const generateBearerToken = async (userId: number) => {
  const token = await encode({
    token: {
      id: userId,
    },
    secret: process.env.NEXTAUTH_SECRET ?? "",
  });
  return token;
};

export const createTestSession = async (userId: number) => {
  const token = await generateBearerToken(userId);
  const sessionToken = generateBase64Token();
  await db.account.create({
    data: {
      userId,
      provider: "credentials",
      providerAccountId: `provider-${userId}`,
      refresh_token: token,
      access_token: token,
      type: "access_token",
      expires_at: 1000 * 60 * 60 * 24,
    },
  });
  await db.session.create({
    data: {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      sessionToken: sessionToken,
      userId,
    },
  });
  return sessionToken;
};
