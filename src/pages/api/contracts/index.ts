import { Contract } from "@/lib/prisma-client";
import { createContract, getUserContracts, validateContractInput } from "@/models/contract";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string, number, date, InferType } from "yup";
import { runController } from "@/utils/controller";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Contract | Contract[] | Error>
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
      await runController({
        authentication: true,
        req,
        res,
        action: async (req) => {
          const userId = Number(req.headers.userId);
          const contracts = await getUserContracts(userId);
          return contracts;
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
      });
      type ContractInput = InferType<typeof contractSchema>;
      await runController<ContractInput, Contract>({
        authentication: true,
        validation: {
          schema: contractSchema,
        },
        req,
        res,
        action: async (req) => {
          // Only the logged-in contractor can create a contract for a client
          const contractorId = Number(req.headers.userId);
          const { body } = req;
          // Check the validity of the contract to create
          const contractInput = {
            name: body.name,
            terms: body.terms,
            totalCost: body.totalCost,
            status: "pending",
            hourlyRate: body.hourlyRate,
            hoursPerWeek: body.hoursPerWeek,
            totalHours: body.totalHours,
            startDate: body.startDate,
            endDate: body.endDate,
            client: { connect: { id: body.clientId } },
            contractor: { connect: { id: contractorId } },
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
