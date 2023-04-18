//
// This file contains functions that return mock data for the Contract model.
// This is useful for testing.
// You can expand this file to include other mocked Contract with different default values.
//

import type { Prisma } from "@/lib/prisma-client";
import { LocalDate } from "@js-joda/core";

type Relations = Partial<{
  contractorId: number;
  clientId: number;
  jobId: number;
}>;

export const getMockContractInput = (
  overrides: Partial<Prisma.ContractCreateInput> & Relations = {}
) => {
  const contract: Prisma.ContractCreateInput = {
    name: "Mock Contract 1",
    contractor: { connect: { id: overrides.contractorId ?? 1 } },
    client: { connect: { id: overrides.clientId ?? 2 } },
    job: { connect: { id: overrides.jobId ?? 1 } },
    terms: "Mock Terms",
    startDate: new Date(LocalDate.now().toString()),
    endDate: new Date(LocalDate.now().plusDays(7).toString()),
    hourlyRate: "100",
    hoursPerWeek: 40,
    totalHours: 100,
    totalCost: "10000",
    status: "active",
  };
  delete overrides.contractorId;
  delete overrides.clientId;
  delete overrides.jobId;
  return { ...contract, ...overrides };
};
