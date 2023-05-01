import { Contract, ContractStatus } from "@/lib/prisma-client";
import {
  createContract,
  getAllContracts,
  getUserContracts,
  validateContractInput,
} from "@/models/contract";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string, number, date, InferType, mixed } from "yup";
import { runController } from "@/utils/controller";
import { Role } from "@/models/user";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    // TODO: Validate query params
    // TODO: Handle pagination
    // TODO: Handle sorting
    // TODO: Handle filtering
    // TODO: Handle search
    // TODO: Add filter to show only contracts where the user is the client
    // TODO: Add filter to Show only contracts where the user is the contractor
    case "GET":
      await runController<unknown, Contract[]>({
        authentication: [Role.user],
        validation: {
          schema: mixed()
        },
        req,
        res,
        action: async ({ session }) => {
          const userId = session!.user.id;
          const isAdmin = session!.user.role === Role.admin;
          if (isAdmin) {
            return await getAllContracts();
          }
          return getUserContracts(userId);
        },
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
        jobId: number().required(),
      });
      type ContractInput = InferType<typeof contractSchema>;
      await runController<ContractInput, Contract>({
        authentication: [Role.user],
        validation: {
          schema: contractSchema,
        },
        req,
        res,
        action: async ({ session, validatedInput: input }) => {
          // Only the logged-in contractor can create a contract for a client
          const contractorId = session!.user.id;
          // Check the validity of the contract to create
          const contractInput = {
            name: input.name,
            terms: input.terms,
            totalCost: input.totalCost,
            status: ContractStatus.pending,
            hourlyRate: input.hourlyRate,
            hoursPerWeek: input.hoursPerWeek,
            totalHours: input.totalHours,
            startDate: input.startDate,
            endDate: input.endDate,
            client: { connect: { id: input.clientId } },
            contractor: { connect: { id: contractorId } },
            job: { connect: { id: input.jobId } },
          };
          validateContractInput(contractInput);
          // Create the contract and return it
          const createdContract = await createContract(contractInput);
          return createdContract;
        },
      });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
