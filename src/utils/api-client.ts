import { Job } from "@/lib/prisma-client";
import { CreateJobBody, GetJobsQuery } from "@/pages/api/jobs";
import axios from "axios";
import { Dictionary } from "lodash";
import { PaginatedResponse } from "./pagination";

/**
 * Send a request to the marketplace API to create a job
 * @param job 
 * @returns 
 */
export const createJob = async (job: CreateJobBody): Promise<Job> => {
  const url = getUrlStr(`/jobs`);
  const res = await axios.post(url, job);
  return res.data;
};

/**
 * Send a request to the marketplace API to get a list of jobs
 * @param params 
 * @returns 
 */
export const getJobs = async (params: GetJobsQuery) => {
  const url = getUrlStr(`/jobs`, params);
  const res = await axios.get(url);
  return res.data as PaginatedResponse<Job>;
}

const getUrlStr = (path: string, searchParams: Dictionary<string | number> = {}) => {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}${path}`);
  Object.keys(searchParams).forEach((key) => {
    const value = (<any>searchParams)[key];
    if (value) {
      url.searchParams.set(key, value.toString());
    }
  });
  return url.toString();
}