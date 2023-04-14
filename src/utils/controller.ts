import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { ObjectSchema, ValidationError } from "yup";
import { log } from "./logging";
import { Prisma } from "@/lib/prisma-client";
import { isMissingRelatedRecord } from "./db-helpers";
import { Dictionary } from "lodash";
import ActError from "./ActError";

type ControllerParams = {
  authentication?: boolean;
  validation?: {
    schema: ObjectSchema<any>;
    options?: { abortEarly?: boolean };
  };
  req: NextApiRequest;
  res: NextApiResponse;
  action: (req: NextApiRequest) => Promise<Dictionary<any>>;
};

/**
 * This is a custom controller function that can be used to run API actions.
 * It handles authentication, validation, and error handling.
 * @param authentication Whether or not authentication is required. If true, the
 * userId will be added to the request headers.
 * @param validation The validation schema to use
 * @param req The request object
 * @param res The response object
 * @param action The action to run
 */
export const runController = async ({
  authentication,
  validation,
  req,
  res,
  action,
}: ControllerParams) => {
  // userId header is reserved for authentication results.
  delete req.headers.userId;
  // If authentication is required, get the user id from the session
  if (authentication) {
    // TODO get user id from session
    const userId = Number((await getToken({ req }))?.userId);
    if (!userId || Number.isNaN(userId)) {
      res.status(401).json({
        name: "Unauthorized",
        message: "You must be logged in to access this resource.",
      });
      return;
    }
    req.headers.userId = userId.toString();
  }
  // If validation is required, validate the request body or query params
  if (validation) {
    try {
      const values = req.method === "GET" ? req.query : req.body;
      const item = await validation.schema.validate(values, {
        abortEarly: true,
        ...validation.options,
      });
      if (req.method === "GET") {
        req.query = item;
      } else {
        req.body = item;
      }
    } catch (e) {
      // Return 400 when a validation error occurs
      if (e instanceof ValidationError) {
        res.status(400).json({
          name: "ValidationError",
          message: e.message,
        });
        return;
      }
    }
  }
  // Run the action
  try {
    const resBody = await action(req);
    res.status(200).json(resBody);
  } catch (e) {
    // Return 400 when a missing related record error occurs
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      isMissingRelatedRecord(e)
    ) {
      log("MissingRelatedRecord", e.message);
      res.status(400).json({
        name: "MissingRelatedRecord",
        message: "One or more of the related records does not exist.",
      });
      return;
    }
    // Catch ActErrors and return them as JSON
    if ( e instanceof ActError) {
      res.status(e.getStatus()).json(e.toJSON());
      return;
    }
    // Return 500 when an unexpected error occurs
    const error = e as Error;
    log("Unexpected", error.message);
    res.status(500).json(error);
  }
};