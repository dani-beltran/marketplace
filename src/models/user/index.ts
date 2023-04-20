import db from "@/db-client";
import { User, Prisma } from "@/lib/prisma-client";

export type PublicUser = Pick<User, "id" | "name" | "image">;

export const getUser = async (id: number) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
  });
  return user;
};

export const getUserByEmail = async (email: string) => {
  const user = await db.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};

type getUsersArg = {
  onlyPublicData: boolean;
};

export const getUsers = async ({
  onlyPublicData,
}: getUsersArg): Promise<User[] | PublicUser[]> => {
  if (onlyPublicData) {
    return db.user.findMany({ select: { id: true, name: true, image: true } });
  } else {
    return db.user.findMany();
  }
};

export const createUser = async (user: Prisma.UserCreateInput) => {
  const newUser = await db.user.create({
    data: {
      ...user,
    },
  });
  return newUser;
};

export const updateUser = async (user: User) => {
  const updatedUser = await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      ...user,
    },
  });
  return updatedUser;
};

export const deleteUser = async (id: number) => {
  const deletedUser = await db.user.delete({
    where: {
      id,
    },
  });
  return deletedUser;
};
