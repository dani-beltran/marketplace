import { Prisma } from "@/lib/prisma-client";

export const isMissingRelatedRecord = (
  e: Prisma.PrismaClientKnownRequestError
) => {
  if (e.code === "P2025") {
    return true;
  }
};

export const isUniqueConstraintViolation = (
  e: Prisma.PrismaClientKnownRequestError
) => {
  if (e.code === "P2002") {
    return true;
  }
};

export const isForeignKeyConstraintViolation = (
  e: Prisma.PrismaClientKnownRequestError
) => {
  if (e.code === "P2014") {
    return true;
  }
}
