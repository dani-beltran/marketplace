import { getMostPaidUsers } from "@/models/user";
import { runController } from "@/utils/controller";
import type { NextApiRequest, NextApiResponse } from "next";
import { mixed } from "yup";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET":
      await runController<unknown, any>({
        // Anybody can see the best payer users in the platform
        authentication: [],
        validation: {
          schema: mixed()
        },
        req,
        res,
        action: async () => {
          const res = await getMostPaidUsers();
          return res;
        },
      });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
