import { User } from "@/lib/prisma-client";
import { createUser, getUsers } from "@/models/user";
import { runController } from "@/utils/controller";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string, ValidationError } from "yup";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User[] | User | Error>
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
      await runController({
        // Anybody can see the users in the platform
        authentication: false,
        req,
        res,
        action: async () => {
          const users = await getUsers({ select: { id: true, name: true } });
          return users;
        },
      });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
