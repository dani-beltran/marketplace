import db from "@/db-client";
import { Job, Prisma } from "@/lib/prisma-client";
import {
  CursorPaginationParams,
  PaginationParams,
} from "@/utils/pagination";

/**
 * Creates a job with the given data
 * @param job
 * @returns the created job
 */
export const createJob = async (job: Prisma.JobCreateInput) => {
  const createdJob = await db.job.create({
    data: {
      ...job,
    },
  });
  return createdJob;
};

/**
 * @param id
 * @returns a job with the given id
 */
export const getJob = async (id: number) => {
  const job = await db.job.findUnique({
    where: {
      id,
    },
  });
  return job;
};

/**
 * Get all jobs.
 * You can use the pagination params to paginate the results.
 * First page starts at 0.
 */
export const getJobs = async ({
  pageSize,
  page,
  orderBy,
  order,
}: PaginationParams): Promise<Job[]> => {
  const jobs = await db.job.findMany({
    take: pageSize,
    skip: pageSize * page,
    orderBy: {
      [orderBy]: order,
    },
  });
  return jobs;
};

/**
 * Get all the jobs a user has created.
 * You can use the pagination params to paginate the results.
 * First page starts at 0.
 */
export const getUserJobs = async (
  userId: number,
  { pageSize, page, orderBy, order }: PaginationParams
) => {
  const jobs = await db.job.findMany({
    where: { userId },
    take: pageSize,
    skip: pageSize * page,
    orderBy: {
      [orderBy]: order,
    },
  });
  return jobs;
};

/**
 * Gets all the jobs that are ongoing for a user regardless of whether they are the contractor or the client.
 * Ongoing jobs are jobs that have been accepted by both parties and are currently in progress.
 * @param userId
 */
export const getOngoingJobs = async (
  userId: number,
  { orderBy, order, cursorId, take }: CursorPaginationParams
): Promise<Job[]> => {
  const cursor = cursorId ? { id: cursorId } : undefined;

  const jobs = await db.job.findMany({
    where: {
      contract: {
        status: "accepted",
        startDate: {
          lte: new Date(),
        },
        endDate: {
          gte: new Date(),
        },
        OR: [{ contractorId: userId }, { clientId: userId }],
      },
    },
    take,
    skip: cursor ? 1 : 0,
    orderBy: {
      [orderBy]: order,
    },
    cursor,
    select: {
      id: true,
      name: true,
      description: true,
      issueUrl: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      contract: true,
    },
  });
  return jobs;
};

/**
 * @returns The number of jobs in the database
 */
export const countJobs = async () => {
  const count = await db.job.count();
  return count;
};

/**
 * @param userId
 * @returns The number of jobs a user has created
 */
export const countUserJobs = async (userId: number) => {
  const count = await db.job.count({
    where: {
      userId,
    },
  });
  return count;
};
