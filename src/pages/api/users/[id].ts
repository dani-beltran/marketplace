import { User } from "@/lib/prisma-client";
import { deleteUser, getUser } from "@/models/user";
import ActionError from "@/utils/ActionError";
import { runController } from "@/utils/controller";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function userHandler(
  req: NextApiRequest,
  res: NextApiResponse<User | Error>
) {
  const { query, method } = req;
  const id = parseInt(query.id as string, 10);

  switch (method) {
    case "GET":
      await runController({
        authentication: true,
        req,
        res,
        action: async () => {
          const user = await getUser(id);
          if (!user) {
            throw new ActionError("NotFound", `User with id ${id} not found`);
          }
          // Only the user can see all if their own data
          if (id === Number(req.headers.userId)) {
            return user;
          } else {
            return {
              id: user.id,
              name: user.name,
              image: user.image,
            };
          }
        },
      });
      break;

    case "DELETE":
      await runController({
        authentication: true,
        req,
        res,
        action: async () => {
          // Only the user can delete its own account
          if (id !== Number(req.headers.userId)) {
            throw new ActionError(
              "Forbidden",
              `You are not authorized to delete this user`
            );
          }
          const deletedUser = await deleteUser(id);
          return deletedUser;
        },
      });
      break;

    default:
      // Create and Update are not allowed for users since they are managed by 
      // the auth service
      res.setHeader("Allow", ["GET", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
