import { Job } from "@/lib/prisma-client";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string, InferType, number } from "yup";
import { runController } from "@/utils/controller";
import {
  countJobs,
  countUserJobs,
  createJob,
  getJobs,
  getUserJobs,
} from "@/models/job";
import {
  PaginatedResponse,
  PaginationParams,
  getPaginationSchema,
} from "@/utils/pagination";
import { Role } from "@/models/user";

export type ListJobsQuery = { userId?: number } & PaginationParams;

const createJobSchema = object({
  name: string().required(),
  issueUrl: string().url(),
  description: string().required(),
});
export type CreateJobBody = InferType<typeof createJobSchema>;

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
          let jobs: Job[];
          let count: number;
          if (input.userId) {
            [jobs, count] = await Promise.all([
              getUserJobs(input.userId, input),
              countUserJobs(input.userId),
            ]);
          } else {
            [jobs, count] = await Promise.all([getJobs(input), countJobs()]);
          }
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
      await runController<CreateJobBody, Job>({
        authentication: [Role.user],
        validation: {
          schema: createJobSchema,
        },
        req,
        res,
        action: async ({ validatedInput: input, session }) => {
          // Only the logged-in user can create a job posting
          const userId = session!.user.id;
          // Create the job and return it
          const job = await createJob({
            ...input,
            user: { connect: { id: userId } },
          });
          return job;
        },
      });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
