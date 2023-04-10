//
// This file contains functions that return mock data for the User model.
// This is useful for testing.
// You can expand this file to include other mocked Users with different default values.
//

import type { Prisma } from "@/lib/prisma-client";

export const getMockUser = (
  overrides: Partial<Prisma.UserCreateInput> = {}
) => {
  const user: Prisma.UserCreateInput = {
    email: "mockUser1@testmail.com",
    name: "Mock User 1",
    ...overrides,
  };
  return user;
};
