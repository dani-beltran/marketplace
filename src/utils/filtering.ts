import { LocalDate } from "@js-joda/core";
import { date, number } from "yup";

export type DateFilter = {
  startDate: Date;
  endDate: Date;
};

export type DateFilterQueryParams = Partial<DateFilter>;

/**
 * @param defaultStartDate default start date for the date filter, if not provided, 
 * it will be 1 month ago.
 * @returns a date filter schema
 */
export const getDateFilterSchema = (
  defaultStartDate = new Date(LocalDate.now().minusMonths(1).toString()),
) => {
  return {
    startDate: date().default(defaultStartDate),
    endDate: date().default(new Date()),
  };
};

export type LimitFilter = {
  limit: number;
};

export type LimitFilterQueryParams = Partial<LimitFilter>;

/**
 * @param defaultLimit default limit for the limit filter, if not provided,
 * it will be 100.
 * @returns a limit filter schema
 */
export const getLimitFilterSchema = (defaultLimit = 100) => {
  return {
    limit: number().min(1).max(1000).default(defaultLimit),
  };
};
