//
// This file contains the pagination schema and types used in the API.
//
// Pagination is good for jumping to a specific page of results.
// However, it is not good for performance and scalability, since the DB will
// still need to traverse all the offset records to get the results.
// Another option is to use cursors, which are more performant and scalable, but
// does not allow to jump to a specific page and can only sort by a sequential
// unique column such as ID or a timestamp. It will be good for a infinity scroll
// though.
//
import { mixed, number, string } from "yup";

// For query pagination params we make all the fields optional, since they
// will be validated from the schema and added the default values.
export type PaginationQueryParams = Partial<PaginationParams>

export type PaginationParams = {
  pageSize: number;
  page: number;
  orderBy: string;
  order: "asc" | "desc";
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type Pagination = {
  pageSize: number;
  page: number;
  count: number;
};

/**
 * The pagination schema is used to validate the query params for pagination.
 * @param orderByOpts
 * @returns
 */
export const getPaginationSchema = (
  params: { orderByOpts: string[] } = { orderByOpts: ["createdAt"] }
) => {
  const orderByOptsRegExp = new RegExp(
    "^(" + params.orderByOpts.join("|") + ")$"
  );
  return {
    pageSize: number().min(10).default(10),
    page: number().min(0).default(0),
    orderBy: string().matches(orderByOptsRegExp).default("createdAt"),
    order: mixed<"asc" | "desc">().oneOf(["asc", "desc"]).default("desc"),
  };
};

//
// CURSOR PAGINATION
//
export type CursorPaginationParams = {
  orderBy: "createdAt" | "updatedAt";
  order: "asc" | "desc";
  cursorId?: number;
  take: number; // How many records to take. Negative values will return the previous records.
};

export type CursorPaginationQueryParams = Partial<CursorPaginationParams>;

export type CursorPaginatedResponse<T> = {
  data: T[];
  pagination: CursorPagination;
};

export type CursorPagination = {
  cursorId: number;
};

/**
 * The pagination schema is used to validate the query params for pagination.
 * @param orderByOpts
 * @returns
 */
export const getCursorPaginationSchema = () => {
  return {
    take: number().default(10),
    cursorId: number(),
    orderBy: mixed<"createdAt" | "updatedAt">().oneOf(['createdAt', 'updatedAt']).default("createdAt"),
    order: mixed<"asc" | "desc">().oneOf(["asc", "desc"]).default("desc"),
  };
};