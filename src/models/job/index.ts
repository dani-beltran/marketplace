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

export const getJobs = async ({
  size,
  page,
  orderBy,
  order,
}: PaginationParams): Promise<Job[]> => {
  const jobs = await db.job.findMany({
    take: size,
    skip: size * (page - 1),
    orderBy: {
      [orderBy]: order,
    },
  });
  return jobs;
};

export const getUserJobs = async (
  userId: number,
  { size, page, orderBy, order }: PaginationParams
) => {
  const jobs = await db.job.findMany({
    where: { userId },
    take: size,
    skip: size * (page - 1),
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