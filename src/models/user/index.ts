import db from '@/db-client';
import { User, Prisma } from '@/lib/prisma-client';

export const getUser = async (id: number) => {
  const user = await db.user.findUnique({
    where: {
      id
    }
  })
  return user;
}

export const getUserByEmail = async (email: string) => {
  const user = await db.user.findUnique({
    where: {
      email
    }
  })
  return user;
}

type getUserArgs = {
  select?: Prisma.UserSelect
}

export const getUsers = async ({select}: getUserArgs) => {
  const users = await db.user.findMany({select})
  return users;
}

export const createUser = async (user: Prisma.UserCreateInput) => {
  const newUser = await db.user.create({
    data: {
      ...user
    }
  })
  return newUser;
}

export const updateUser = async (user: User) => {
  const updatedUser = await db.user.update({
    where: {
      id: user.id
    },
    data: {
      ...user
    }
  })
  return updatedUser;
}

export const deleteUser = async (id: number) => {
  const deletedUser = await db.user.delete({
    where: {
      id
    }
  })
  return deletedUser;
}
