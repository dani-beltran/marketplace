//
// This file contains functions that return mock data for the Invoice model.
// This is useful for testing.
// You can expand this file to include other mocked Invoice with different default values.
//

import { Prisma } from "@/lib/prisma-client";
import { LocalDate } from "@js-joda/core";

type Relations = Partial<{
  contractId: number;
}>;

export const getMockInvoiceInput = (
  overrides: Partial<Prisma.InvoiceCreateInput> & Relations = {}
) => {
  const invoice: Prisma.InvoiceCreateInput = {
    contract: { connect: { id: overrides.contractId ?? 1 } },
    status: "pending",
    subtotal: "1000.00",
    vatRate: 20,
    discountRate: 0,
    number: "INV-0001",
    dueDate: new Date(LocalDate.now().plusDays(30).toString()),
    date: new Date(LocalDate.now().toString()),
  };
  delete overrides.contractId;
  return { ...invoice, ...overrides };
};
