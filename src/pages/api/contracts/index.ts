import { Contract, Prisma } from "@/lib/prisma-client";
import { createContract, getUserContracts } from "@/models/contract";
import { log } from "@/utils/logging";
import { isMissingRelatedRecord } from "@/utils/db-helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { object, string, ValidationError, number, date } from "yup";
import { getToken } from "next-auth/jwt";

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

      // TODO get user id from session
      const userId = Number((await getToken({ req }))?.userId);
      if (!userId || Number.isNaN(userId)) {
        res
          .status(401)
          .json({
            name: "Unauthorized",
            message: "You must be logged in to access this resource.",
          });
        return;
      }
      const contracts = await getUserContracts(userId);
      res.status(200).json(contracts);
      break;

    case "POST":
      const contractSchema = object({
        name: string().required(),
        contractorId: number().required(),
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
      try {
        const contract = await contractSchema.validate(body, {
          abortEarly: true,
        });
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
          contractor: { connect: { id: contract.contractorId } },
        });
        res.status(200).json(createdContract);
      } catch (e) {
        if (e instanceof ValidationError) {
          res.status(400).json({
            name: "ValidationError",
            message: e.message,
          });
          return;
        }
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          isMissingRelatedRecord(e)
        ) {
          log("MissingRelatedRecord", e.message);
          res.status(400).json({
            name: "MissingRelatedRecord",
            message: "One or more of the related records does not exist.",
          });
          return;
        }
        const error = e as Error;
        log("Unexpected", error.message);
        res.status(500).json(error);
        return;
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
