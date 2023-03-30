import { PrismaClient } from "@/lib/prisma-client";

const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// Soft delete middleware for some models
db.$use(async (params, next) => {
  const softDelModels = ["Contract", "Job"];
  if (softDelModels.indexOf(params.model?.toString()  ?? "") === -1) {
    return next(params);
  }
  if (params.action == "delete") {
    // Delete queries
    // Change action to an update
    params.action = "update";
    params.args["data"] = { deletedAt: new Date() };
  }
  if (params.action == "deleteMany") {
    // Delete many queries
    params.action = "updateMany";
    if (params.args.data != undefined) {
      params.args.data["deleted"] = true;
    } else {
      params.args["data"] = { deletedAt: new Date() };
    }
  }
  if (
    params.action == "findMany" ||
    params.action == "findFirst" ||
    params.action == "findUnique"
  ) {
    // Find queries
    // Add a filter to exclude deleted items
    params.args = params.args ?? {};
    if (params.args.where != undefined) {
      params.args.where["deletedAt"] = null;
    } else {
      params.args["where"] = { deletedAt: null };
    }
  }
  return next(params);
});

export default db;
