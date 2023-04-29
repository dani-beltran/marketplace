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
import axios from "axios";
import { mixed, number, object, string } from "yup";

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
  return object({
    pageSize: number().min(10).default(10),
    page: number().min(0).default(0),
    orderBy: string().matches(orderByOptsRegExp).default("createdAt"),
    order: mixed<"asc" | "desc">().oneOf(["asc", "desc"]).default("desc"),
  });
};

/**
 * Fetches a page of results from the API.
 * @param url 
 * @param pagination 
 * @returns 
 */
export const pageFetch = async <T>(
  url: string,
  pagination: {
    pageSize: number;
    page: number;
  }
): Promise<PaginatedResponse<T>> => {
  const pageUrl = new URL(url);
  pageUrl.searchParams.set("page", pagination.page.toString());
  pageUrl.searchParams.set("pageSize", pagination.pageSize.toString());
  return axios(pageUrl.toString()).then((res) => res.data);
}
