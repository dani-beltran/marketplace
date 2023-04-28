import db from "@/db-client";
import { encode } from "next-auth/jwt";
import { generateBase64Token } from "./crypto";
import { Prisma, User } from "@/lib/prisma-client";

/**
 * Flushes the database removing all data.
 * DANGEROUS - USE WITH CAUTION
 */
export const flushDB = async () => {
  await db.$executeRaw`DELETE FROM "Contract"`;
  await db.$executeRaw`DELETE FROM "Job"`;
  await db.$executeRaw`DELETE FROM "Session"`;
  await db.$executeRaw`DELETE FROM "Account"`;
  await db.$executeRaw`DELETE FROM "VerificationToken"`;
  await db.$executeRaw`DELETE FROM "User"`;
  // Using DELETE FROM because using SQLite at the moment
  // TODO: Use TRUNCATE when using PostgreSQL
  // await db.$executeRaw`TRUNCATE "User" CASCADE`;
};

/**
 * Removes all test data from the database related to the users provided.
 * @param users
 */
export const deleteTestData = async (users: User[]) => {
  const userIds = users.filter((u) => u !== undefined).map((u) => u.id);
  await db.$executeRaw`DELETE FROM "Contract" WHERE "clientId" IN (${Prisma.join(
    userIds
  )}) OR "contractorId" IN (${Prisma.join(userIds)})`;
  await db.$executeRaw`DELETE FROM "Job" WHERE "userId" IN (${Prisma.join(
    userIds
  )})`;
  await db.$executeRaw`DELETE FROM "Session" WHERE "userId" IN (${Prisma.join(
    userIds
  )})`;
  await db.$executeRaw`DELETE FROM "Account" WHERE "userId" IN (${Prisma.join(
    userIds
  )})`;
  await db.$executeRaw`DELETE FROM "User" WHERE "User"."id" IN (${Prisma.join(
    userIds
  )})`;
};

/**
 * Generates a JWT bearer token for a user. Used for testing.
 * @param userId The user ID
 * @returns
 */
const generateBearerToken = async (userId: number) => {
  const token = await encode({
    token: {
      id: String(userId),
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
