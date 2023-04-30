import { payInvoice } from "@/models/invoice";
import { Role } from "@/models/user";
import { runController } from "@/utils/controller";
import { NextApiRequest, NextApiResponse } from "next";
import { mixed } from "yup";

export default async function userHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, method } = req;
  const id = parseInt(query.id as string);

  switch (method) {
    case "POST":
      await runController<unknown, void>({
        authentication: [Role.user],
        validation: {
          schema: mixed()
        },
        req,
        res,
        action: async ({session}) => {
          await payInvoice(id, session?.user.id!);
        },
      });
      break;

    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}