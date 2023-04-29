import db from "@/db-client";
import { Job, Prisma } from "@/lib/prisma-client";
import { PaginationParams } from "@/utils/pagination";

export const createJob = async (job: Prisma.JobCreateInput) => {
  const createdJob = await db.job.create({
    data: {
      ...job,
    },
  });
  return createdJob;
};

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
 * @returns 
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
 * @returns 
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

export const countJobs = async () => {
  const count = await db.job.count();
  return count;
}