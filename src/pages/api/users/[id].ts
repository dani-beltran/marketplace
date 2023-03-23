import { User } from "@/lib/prisma-client";
import { deleteUser, getUser, updateUser } from "@/models/user";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function userHandler(
  req: NextApiRequest,
  res: NextApiResponse<User | Error>
) {
  const { query, method } = req;
  const id = parseInt(query.id as string, 10);

  switch (method) {
    case "GET":
      const user = await getUser(id);
      if (!user) {
        res
          .status(404)
          .json({
            message: `User with id ${id} not found`,
            name: "UserNotFound",
          });
        return;
      }
      res.status(200).json(user);
      break;

    case "PUT":
      // TODO: Validate request body
      const updatedUser = await updateUser({...req.body, id});
      res.status(200).json(updatedUser);
      break;

    case "DELETE":
      const deletedUser = await deleteUser(id);
      res.status(200).json(deletedUser);
      break;

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
