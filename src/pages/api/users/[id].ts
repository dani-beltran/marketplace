import { User } from "@/lib/prisma-client";
import { PublicUser, Role, deleteUser, getUser } from "@/models/user";
import ActionError from "@/utils/ActionError";
import { runController } from "@/utils/controller";
import type { NextApiRequest, NextApiResponse } from "next";
import { mixed } from "yup";

export default async function userHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, method } = req;
  const id = parseInt(query.id as string, 10);

  switch (method) {
    case "GET":
      await runController<unknown, PublicUser | User>({
        authentication: [Role.user],
        validation: {
          schema: mixed()
        },
        req,
        res,
        action: async ({session}) => {
          const user = await getUser(id);
          if (!user) {
            throw new ActionError("NotFound", `User with id ${id} not found`);
          }
          // Only the user can see all if their own data
          if (id === session!.user.id) {
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
      await runController<unknown, User>({
        authentication: [Role.user],
        validation: {
          schema: mixed()
        },
        req,
        res,
        action: async ({session}) => {
          // User can delete its own account, but no others. Admins can delete all.
          if (id !== session!.user.id && session!.user.role !== Role.admin) {
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
