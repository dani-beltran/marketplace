import db from "@/db-client";
import { Prisma } from "@/lib/prisma-client";
import { PaginationParams } from "../shared-types";

export const createJob = async (job: Prisma.JobCreateInput) => {
  const createdJob = await db.job.create({
    data: job,
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

export const getJobs = async ({ limit, offset }: PaginationParams) => {
  const jobs = await db.job.findMany({
    select: {
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      id: true,
      userId: true,
    },
    take: limit,
    skip: offset,
    orderBy: {
      createdAt: "desc",
    },
  });
  return jobs;
};

export const getUserJobs = async (
  userId: number,
  { limit, offset }: PaginationParams
) => {
  const jobs = await db.job.findMany({
    where: { userId },
    take: limit,
    skip: offset,
    orderBy: {
      createdAt: "desc",
    },
  });
  return jobs;
};
