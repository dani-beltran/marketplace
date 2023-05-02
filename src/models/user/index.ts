import db from "@/db-client";
import { User, Prisma } from "@/lib/prisma-client";

export type PublicUser = Pick<User, "id" | "name" | "image">;

export enum Role {
  user = "user",
  admin = "admin",
}

export const getUser = async (id: number) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
  });
  return user;
};

export const getUserByEmail = async (email: string) => {
  const user = await db.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};

type getUsersArg = {
  onlyPublicData: boolean;
};

export const getUsers = async ({
  onlyPublicData,
}: getUsersArg): Promise<User[] | PublicUser[]> => {
  if (onlyPublicData) {
    return db.user.findMany({ select: { id: true, name: true, image: true } });
  } else {
    return db.user.findMany();
  }
};

export const createUser = async (user: Prisma.UserCreateInput) => {
  const newUser = await db.user.create({
    data: {
      ...user,
    },
  });
  return newUser;
};

export const updateUser = async (user: User) => {
  const updatedUser = await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      ...user,
    },
  });
  return updatedUser;
};

export const deleteUser = async (id: number) => {
  const deletedUser = await db.user.delete({
    where: {
      id,
    },
  });
  return deletedUser;
};

export type BestPayerUser = {
  id: number;
  name: string;
  image: string;
  totalPaid: number;
}

/**
 * @param start 
 * @param end
 * @param limit the number of users to return
 * @returns a list of users ordered by the total amount paid in the given period
 */
export const getBestPayerUsers = async (start: Date, end: Date, limit = 10) => {
  const rank = await db.$queryRaw`
    SELECT  "User".id, "User"."name", "User"."image", SUM(
      CAST("Invoice"."subtotal" AS FLOAT) + 
      (CAST("Invoice"."subtotal" AS FLOAT) * "Invoice"."vatRate" / 100) -
      (CAST("Invoice"."subtotal" AS FLOAT) * "Invoice"."discountRate" / 100)
    ) as totalPaid
    FROM "User"
    INNER JOIN "Contract" ON "User"."id" = "Contract"."clientId"
    INNER JOIN "Invoice" ON "Contract"."id" = "Invoice"."contractId"
    WHERE "Invoice"."status" = 'paid' 
    AND "Invoice"."paidAt" IS NOT NULL 
    AND "User"."deletedAt" IS NULL 
    AND "Invoice"."deletedAt" IS NULL 
    AND "Invoice"."paidAt" >= Date(${start}) 
    AND "Invoice"."paidAt" <= Date(${end})
    GROUP BY "User"."id"
    ORDER BY totalPaid  DESC
    LIMIT ${limit}`;
  return rank as BestPayerUser[];
};
