import db from "@/db-client";
import { encode } from "next-auth/jwt";

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
export const genBearerToken = async (userId: number) => {
  const token = await encode({
    token: { userId },
    secret: process.env.NEXTAUTH_SECRET ?? "",
  });
  return token;
};
