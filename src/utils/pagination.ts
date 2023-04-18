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
import { number, object, string } from "yup";

export type PaginationParams = {
  size: number;
  page: number;
  orderBy: string;
  order: 'asc' | 'desc';
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    size: number;
    page: number;
    total: number;
  };
};

/**
 * The pagination schema is used to validate the query params for pagination.
 * @param orderByOpts 
 * @returns 
 */
export const getPaginationSchema = (orderByOpts: string[] = ['createdAt']) => {
  const orderByOptsRegExp = new RegExp('^(' + orderByOpts.join("|") + ')$');
  return object({
    size: number().min(1).default(10),
    page: number().min(1).default(1),
    orderBy: string().matches(orderByOptsRegExp).default('createdAt'),
    order: string().matches(/^(asc|desc)$/).default('desc'),
  });
}