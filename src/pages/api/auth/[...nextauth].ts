import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import db from "@/db-client";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ email }) {
      // Check if the user is allowed to sign in
      return true;
    },
    async redirect({ url, baseUrl }) {
      // The redirect callback is called anytime the user is redirected to a
      // callback URL (e.g. on sign in or sign out).
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token }) {
      // Use this callback to add custom properties to the JWT
      return token;
    },
    async session({ session, user }) {
      // Use this callback to send properties to the client through the session.
      if (session.user) {
        session.user["id"] = Number(user.id);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

export default NextAuth(authOptions);
