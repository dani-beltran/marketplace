//
// This file contains functions that return mock data for the Job model.
// This is useful for testing.
// You can expand this file to include other mocked Job with different default values.
//

import type { Prisma } from "@/lib/prisma-client";

type Relations = Partial<{
  userId: number;
}>;

export const getMockJobInput = (
  overrides: Partial<Prisma.JobCreateInput> & Relations = {}
) => {
  const job: Prisma.JobCreateInput = {
    name: "Mock Job 1",
    description: 'Mock Description',
    user: { connect: { id: overrides.userId ?? 1 } },
  };
  delete overrides.userId;
  return { ...job, ...overrides };
};
