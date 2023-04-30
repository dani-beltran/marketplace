import { Job } from "@/lib/prisma-client";
import type { NextApiRequest, NextApiResponse } from "next";
import { object } from "yup";
import { runController } from "@/utils/controller";
import { getOngoingJobs } from "@/models/job";
import {
  CursorPaginationQueryParams,
  CursorPaginatedResponse,
  CursorPaginationParams,
  getCursorPaginationSchema,
} from "@/utils/pagination";
import { Role } from "@/models/user";

export type GetOngoingJobsQuery = CursorPaginationQueryParams;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET":
      await runController<CursorPaginationParams, CursorPaginatedResponse<Job>>(
        {
          authentication: [Role.user],
          validation: {
            schema: object({
              ...getCursorPaginationSchema(),
            }),
          },
          req,
          res,
          action: async ({ session, validatedInput: input }) => {
            const jobs = await getOngoingJobs(session?.user?.id!, input);
            const response: CursorPaginatedResponse<Job> = {
              data: jobs,
              pagination: {
                cursorId: jobs[jobs.length - 1]?.id,
              },
            };
            return response;
          },
        }
      );
      break;

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
