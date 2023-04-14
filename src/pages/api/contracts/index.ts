import { Contract, Prisma } from "@/lib/prisma-client";
import { createContract, getUserContracts } from "@/models/contract";
import { log } from "@/utils/logging";
import { isMissingRelatedRecord } from "@/utils/db-helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string, ValidationError, number, date, InferType } from "yup";
import { getToken } from "next-auth/jwt";
import { runController } from "@/utils/controller";
import ActError from "@/utils/ActError";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Contract | Contract[] | Error>
) {
  const { query, body, method } = req;

  switch (method) {
    case "GET":
      // TODO: Validate query params
      // TODO: Handle pagination
      // TODO: Handle sorting
      // TODO: Handle filtering
      // TODO: Handle search
      // TODO: Filter deleted out
      await runController({
        authentication: true,
        req,
        res,
        action: async (req) => {
          const userId = Number(req.headers.userId);
          const contracts = await getUserContracts(userId);
          return contracts;
        }
      });
      break;

    case "POST":
      const contractSchema = object({
        name: string().required(),
        clientId: number().required(),
        terms: string().required(),
        startDate: date().required(),
        endDate: date().required(),
        hourlyRate: string(),
        hoursPerWeek: number(),
        totalHours: number(),
        totalCost: string().required(),
        status: string().required(),
      });
      type ContractInput = InferType<typeof contractSchema>;
      await runController({
        authentication: true,
        validation: {
          schema: contractSchema,
        },
        req,
        res,
        action: async (req) => {
          // Only the logged in contractor can create a contract for a client
          const contractorId = Number(req.headers.userId);
          const contract = req.body as ContractInput;
          // Can't create a contract for yourself
          if (contractorId === contract.clientId) {
            throw new ActError('BadRequest', 'You cannot create a contract for yourself.');
          }
          const createdContract = await createContract({
            name: contract.name,
            terms: contract.terms,
            totalCost: contract.totalCost,
            status: contract.status,
            hourlyRate: contract.hourlyRate,
            hoursPerWeek: contract.hoursPerWeek,
            totalHours: contract.totalHours,
            startDate: new Date(contract.startDate),
            endDate: new Date(contract.endDate),
            client: { connect: { id: contract.clientId } },
            contractor: { connect: { id:  contractorId } },
          });
          return createdContract;
        },
      });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
