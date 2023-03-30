import { Contract } from '@/lib/prisma-client';
import { getUserContracts } from '@/models/contract';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Contract[] | Error>
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
      const contracts = await getUserContracts(1);
      res.status(200).json(contracts);
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
