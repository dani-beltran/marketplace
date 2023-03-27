import { User } from '@/lib/prisma-client';
import { createUser, getUsers } from '@/models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { object, string, ValidationError } from 'yup';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User[] | User | Error>
) {
  const { body, method } = req;

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
        // Users are created and active straight away. We could force users to
        // verify their email address, but that is not implemented yet.
        //
        // If an account was soft deleted and the email is the same, we could 
        // reactivate it. However this is not implemented yet.
        //
        // Passwords are stored in plain text. They should be hashed using bcrypt.
        //
        const userSchema = object({
          email: string().email().required(),
          name: string().required(),
          password: string().required(),
          role: string().required(),
        });
        try {
          const user = await userSchema.validate(body, { abortEarly: true });
          const createdUser = await createUser(user);
          res.status(200).json(createdUser);
        } catch (e) {
          if(e instanceof ValidationError) {
            res.status(400).json({
              name: "ValidationError",
              message: e.message,
            });
            return;
          }
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
