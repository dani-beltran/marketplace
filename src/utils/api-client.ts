import { Job } from "@/lib/prisma-client";
import { CreateJobBody } from "@/pages/api/jobs";
import axios from "axios";

export const createJob = async (job: CreateJobBody): Promise<Job> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await axios.post(`${baseUrl}/jobs`, job);
  return res.data;
};
