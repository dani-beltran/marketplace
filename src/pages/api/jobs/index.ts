import { Contract, Job } from "@/lib/prisma-client";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string, number, date, InferType } from "yup";
import { runController } from "@/utils/controller";
import { countJobs, createJob, getJobs } from "@/models/job";
import {
  PaginatedResponse,
  PaginationParams,
  getPaginationSchema,
} from "@/utils/pagination";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Contract | Contract[] | Error>
) {
  const { method } = req;

  switch (method) {
    // TODO: Handle filtering (by dates, by name)
    // TODO: Add filter to show only jobs created by user
    case "GET":
      const searchParamsSchema = getPaginationSchema([
        "createdAt",
        "updatedAt",
      ]);
      await runController<PaginationParams, PaginatedResponse<Job>>({
        authentication: false,
        validation: {
          schema: searchParamsSchema,
        },
        req,
        res,
        action: async (_req, input) => {
          const [jobs, count] = await Promise.all([
            getJobs(input),
            countJobs(),
          ]);

          const response: PaginatedResponse<Job> = {
            data: jobs,
            pagination: {
              page: input.page,
              size: input.size,
              total: count,
            },
          };
          return response;
        },
      });
      break;

    case "POST":
      const jobInput = object({
        name: string().required(),
        description: string().required(),
      });
      type JobInput = InferType<typeof jobInput>;
      await runController<JobInput, Job>({
        authentication: true,
        validation: {
          schema: jobInput,
        },
        req,
        res,
        action: async ({ headers }, input) => {
          // Only the logged-in user can create a job posting
          const userId = Number(headers.userId);
          const jobInput = {
            name: input.name,
            description: input.description,
            user: { connect: { id: userId } },
          };
          // Create the job and return it
          const job = await createJob(jobInput);
          return job;
        },
      });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
