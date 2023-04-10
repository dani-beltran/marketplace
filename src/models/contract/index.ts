import db from '@/db-client';
import { Contract, Prisma } from '@/lib/prisma-client';

/**
 * @returns all contracts for a given user independently of whether they are 
 * the client or the contractor.
 * @param userId The user ID
 */
export const getUserContracts = async (userId: number) => {
  const contracts = await db.contract.findMany({
    where: {
      OR: [{ contractorId: userId }, { clientId: userId }],
    },
  });
  return contracts;
}

/**
 * 
 * @param userId The user ID
 * @returns all contracts where the user is the client
 */
export const getUserContractsAsClient = async (userId: number) => {
  const contracts = await db.contract.findMany({
    where: {
      clientId: userId,
    },
  });
  return contracts;
}

/**
 * 
 * @param userId The user ID
 * @returns all the contracts where the user is the contractor
 */
export const getUserContractsAsContractor = async (userId: number) => {
  const contracts = await db.contract.findMany({
    where: {
      contractorId: userId,
    },
  });
  return contracts;
}

export const createContract = async (contract: Prisma.ContractCreateInput) => {
  const newContract = await db.contract.create({
    data: contract,
  });
  return newContract;
}

export const updateContract = async (contract: Contract) => {
  const updatedContract = await db.contract.update({
    where: { id: contract.id },
    data: contract,
  });
  return updatedContract;
}

export const deleteContract = async (contractId: number) => {
  const deletedContract = await db.contract.delete({
    where: { id: contractId },
  });
  return deletedContract;
}
