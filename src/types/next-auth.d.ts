import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { Role } from '@/models/user';

declare module "next-auth" {
  interface User extends IUser {}
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: number
      role: Role
    } & DefaultSession["user"]
  }
}

interface IUser extends DefaultUser {
  role?: Role;
}

declare module "next-auth/jwt" {
  interface JWT extends IUser {}
}