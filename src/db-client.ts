import { PrismaClient } from "@/lib/prisma-client";

const db = new PrismaClient({
  datasources: {db: {url: process.env.DATABASE_URL}}
});

// Soft delete middleware for all models
db.$use(async (params, next) => {
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
  return next(params);
});

export default db;
