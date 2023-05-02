import { BestPayerUser, getBestPayerUsers } from "@/models/user";
import { runController } from "@/utils/controller";
import {
  DateFilter,
  LimitFilter,
  getDateFilterSchema,
  getLimitFilterSchema,
} from "@/utils/filtering";
import { LocalDate } from "@js-joda/core";
import type { NextApiRequest, NextApiResponse } from "next";
import { object } from "yup";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET":
      const aYearAgo = new Date(LocalDate.now().minusYears(1).toString());
      await runController<DateFilter & LimitFilter, BestPayerUser[]>({
        // Anybody can see the best payer users in the platform
        authentication: [],
        validation: {
          schema: object({
            ...getLimitFilterSchema(10),
            ...getDateFilterSchema(aYearAgo),
          }),
        },
        req,
        res,
        action: async ({ validatedInput: input }) => {
          const res = await getBestPayerUsers(
            input.startDate,
            input.endDate,
            input.limit
          );
          return res;
        },
      });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
