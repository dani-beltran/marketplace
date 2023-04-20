import { PublicUser, getUsers } from "@/models/user";
import { runController } from "@/utils/controller";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET":
      // TODO: Validate query params
      // TODO: Handle pagination
      // TODO: Handle sorting
      // TODO: Handle filtering
      // TODO: Handle search
      // TODO: Filter deleted out
      await runController<unknown, PublicUser[]>({
        // Anybody can see the users in the platform
        authentication: false,
        req,
        res,
        action: async () => {
          const users = await getUsers({onlyPublicData: true});
          return users;
        },
      });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
