import { currencyRegExp } from "@/config/currencies";
import db from "@/db-client";
import { Contract, Prisma } from "@/lib/prisma-client";
import ActionError from "@/utils/ActionError";
import {
  formatDate,
  getWeeksBetweenDates,
  getWeeksBetweenDatesReminder,
} from "@/utils/datetime-helpers";
import { LocalDate } from "@js-joda/core";
import currency from "currency.js";

/**
 * TODO: Add pagination
 * To be used only by admin users.
 * @returns all contracts.
 */
export const getAllContracts = async () => {
  const contracts = await db.contract.findMany();
  return contracts;
};

/**
 * TODO: Add pagination
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
};

/**
 * TODO: Add pagination
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
};

/**
 * TODO: Add pagination
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
};

export const createContract = async (contract: Prisma.ContractCreateInput) => {
  const newContract = await db.contract.create({
    data: contract,
  });
  return newContract;
};

export const updateContract = async (contract: Contract) => {
  const updatedContract = await db.contract.update({
    where: { id: contract.id },
    data: contract,
  });
  return updatedContract;
};

export const deleteContract = async (contractId: number) => {
  const deletedContract = await db.contract.delete({
    where: { id: contractId },
  });
  return deletedContract;
};

/**
 *  A function that validates a contract input to be used before creating or updating a contract.
 * @throws ActionError if the contract is invalid
 */
export const validateContractInput = (contract: Prisma.ContractCreateInput) => {
  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);

   // Can't create a contract for yourself
   if (contract.contractor.connect?.id === contract.client.connect?.id) {
    throw new ActionError(
      "BadRequest",
      "The contractor and client cannot be the same person"
    );
  }
  // Check if the contract is expired
  if (endDate < new Date()) {
    throw new ActionError("BadRequest", "The contract is expired");
  }
  // Check if the contract is starting in the past
  if (LocalDate.now().compareTo(LocalDate.parse(formatDate(startDate))) > 0) {
    throw new ActionError("BadRequest", "The contract is starting in the past");
  }
  // Check if the contract is starting after it ends
  if (startDate > endDate) {
    throw new ActionError("BadRequest", "The contract is starting after it ends");
  }
  // Check if hourly rate is set if hours per week is set
  if (contract.hoursPerWeek && !contract.hourlyRate) {
    throw new ActionError("BadRequest", "The contract is missing an hourly rate");
  }
  // Check if hourly rate is set if total hours is set
  if (contract.totalHours && !contract.hourlyRate) {
    throw new ActionError("BadRequest", "The contract is missing an hourly rate");
  }
  // Check if total hours is set if hours per week is set
  if (contract.hoursPerWeek && !contract.totalHours) {
    throw new ActionError("BadRequest", "The contract is missing total hours");
  }
  // Check if is whole weeks between start and end date if hoursPerWeek is set
  if (
    contract.hoursPerWeek &&
    getWeeksBetweenDatesReminder(startDate, endDate) !== 0
  ) {
    throw new ActionError(
      "BadRequest",
      "The contract duration is not a whole number of weeks and this is required when hours per week is set"
    );
  }
  // Check if total hours matches the hours per week and the contract duration
  if (
    contract.hoursPerWeek &&
    contract.totalHours &&
    contract.totalHours !==
      getWeeksBetweenDates(startDate, endDate) * contract.hoursPerWeek
  ) {
    throw new ActionError(
      "BadRequest",
      "The contract total hours does not match the calculated total hours from hours per week and the duration of the contract"
    );
  }
  // Check if the contract has an invalid total cost
  if (currencyRegExp.test(contract.totalCost) === false) {
    throw new ActionError(
      "BadRequest",
      "The contract total cost has the wrong format"
    );
  }
  // Check if total cost matches the total hours and hourly rate
  if (
    contract.hourlyRate &&
    contract.totalHours &&
    currency(contract.totalCost) !==
      currency(contract.hourlyRate).multiply(contract.totalHours)
  ) {
    throw new ActionError(
      "BadRequest",
      "The contract total cost does not match the calculated total cost from hours and hourly rate"
    );
  }
  // If none of the above, the contract is valid
  return true;
};
