import { Job } from "@/lib/prisma-client";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string, InferType, number } from "yup";
import { runController } from "@/utils/controller";
import { countJobs, createJob, getJobs, getUserJobs } from "@/models/job";
import {
  PaginatedResponse,
  PaginationParams,
  getPaginationSchema,
} from "@/utils/pagination";
import { Role } from "@/models/user";

type ListJobsQuery = { userId?: number } & PaginationParams;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    // TODO: Handle filtering (by dates, by name)
    case "GET":
      const searchParamsSchema = getPaginationSchema({
        orderByOpts: ["createdAt", "updatedAt"],
      });
      await runController<ListJobsQuery, PaginatedResponse<Job>>({
        // Anybody can see the jobs in the platform
        authentication: [],
        validation: {
          schema: object({
            userId: number(), // It is possible to filter by the user who published it
            ...searchParamsSchema,
          }),
        },
        req,
        res,
        action: async ({ validatedInput: input }) => {
          const fetchJobs = input.userId
            ? getUserJobs(input.userId, input)
            : getJobs(input);
          const [jobs, count] = await Promise.all([fetchJobs, countJobs()]);
          const response: PaginatedResponse<Job> = {
            data: jobs,
            pagination: {
              page: input.page,
              pageSize: input.pageSize,
              count,
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
        authentication: [Role.user],
        validation: {
          schema: jobInput,
        },
        req,
        res,
        action: async ({ validatedInput: input, session }) => {
          // Only the logged-in user can create a job posting
          const userId = session!.user.id;
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
