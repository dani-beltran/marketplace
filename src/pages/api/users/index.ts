import { User } from '@/lib/prisma-client';
import { createUser, getUsers } from '@/models/user'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User[] | User | Error>
) {
  const { query, method } = req;

  switch (method) {
    case "GET":
      // TODO: Validate query params
      // TODO: Handle pagination
      // TODO: Handle sorting
      // TODO: Handle filtering
      // TODO: Handle search
      // TODO: Filter deleted out
      const users = await getUsers();
      res.status(200).json(users);
      break;

      case "POST":
        // If an account was soft deleted and the email is the same, we could 
        // reactivate it. However this is not implemented yet.
        // TODO: Validate request body
        try {
          const createdUser = await createUser({...req.body});
          res.status(200).json(createdUser);
        } catch (e) {
          const error = e as Error;
          if (error.message.match(/email/i)) {
            res.status(400).json({message: "Email already exists", name: "EmailExists"});
            return;
          }
          res.status(500).json(error);
        }
        break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
