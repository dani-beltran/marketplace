/**
 * @param e error
 * @returns true if the error is a Prisma Error for missing related record
 */
export const isMissingRelatedRecord = (e: unknown) => {
  if (
    e &&
    typeof e === "object" &&
    "code" in e &&
    // PrismaClientKnownRequestError for missing related record
    e.code === "P2025"
  ) {
    return true;
  }
  return false;
};

/**
 * @param e error
 * @returns true if the error is a Prisma Error for unique constraint violation
 */
export const isUniqueConstraintViolation = (e: unknown) => {
  if (
    e &&
    typeof e === "object" &&
    "code" in e &&
    // PrismaClientKnownRequestError for unique constraint violation
    e.code === "P2002"
  ) {
    return true;
  }
  return false;
};

/**
 * @param e error
 * @returns true if the error is a Prisma Error for foreign key constraint violation
 */
export const isForeignKeyConstraintViolation = (e: unknown) => {
  if (
    e &&
    typeof e === "object" &&
    "code" in e &&
    // PrismaClientKnownRequestError for foreign key constraint violation
    e.code === "P2014"
  ) {
    return true;
  }
};
