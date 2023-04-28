import { NextApiRequest, NextApiResponse } from "next";
import { ValidationError, Schema } from "yup";
import { log } from "./logging";
import { Prisma } from "@/lib/prisma-client";
import {
  isForeignKeyConstraintViolation,
  isMissingRelatedRecord,
  isUniqueConstraintViolation,
} from "./db-helpers";
import { Dictionary } from "lodash";
import ActionError from "./ActionError";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]"
import { Session } from "next-auth";

type ControllerParams<T_Input, T_Output> = {
  authentication?: boolean;
  validation: {
    schema: Schema<T_Input>;
    options?: { abortEarly?: boolean };
  };
  req: NextApiRequest;
  res: NextApiResponse;
  action: (
    params: ActionParams<T_Input>
  ) => Promise<T_Output>;
};

type ActionParams<T_Input> = {
  req: NextApiRequest,
  validatedInput: Awaited<T_Input>,
  session?: Session,
}

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
export const runController = async <
  T_Input = unknown,
  T_Output = Dictionary<unknown>
>({
  authentication,
  validation,
  req,
  res,
  action,
}: ControllerParams<T_Input, T_Output>): Promise<void> => {
  // If authentication is required check there is a valid session
  let session;
  if (authentication) {
    session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({
        name: "Unauthorized",
        message: "You must be logged in to access this resource.",
      });
      return;
    }
  }
  // Validation is always required, validate the request body or query params
  try {
    const values = req.method === "GET" ? req.query : req.body;
    const validatedInput = await validation.schema.validate(values, {
      abortEarly: true,
      ...validation.options,
    });
    // Run the action
    const resBody = await action({req, validatedInput, session});
    res.status(200).json(resBody);
  } catch (e) {
    // Return 400 when a validation error occurs
    if (e instanceof ValidationError) {
      res.status(400).json({
        name: "ValidationError",
        message: e.message,
      });
      return;
    }
    // Return 409 when a foreign key constraint violation occurs
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      (isForeignKeyConstraintViolation(e) || isUniqueConstraintViolation(e))
    ) {
      log("ForeignKeyConstraintViolation", e.message);
      res.status(409).json({
        name: "ForeignKeyConstraintViolation",
        message: "Violates a foreign key constraint, like uniqueness",
      });
      return;
    }
    // Return 400 when a missing related record error occurs
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      isMissingRelatedRecord(e)
    ) {
      log("MissingRelatedRecord", e.message);
      if (req.method === "DELETE") {
        res.status(404).json({
          name: "NotFound",
          message: "The record does not exist",
        });
        return;
      }
      res.status(400).json({
        name: "MissingRelatedRecord",
        message: "One or more of the related records does not exist",
      });
      return;
    }
    // Catch ActionErrors and return them as JSON
    if (e instanceof ActionError) {
      res.status(e.getStatus()).json(e.toJSON());
      return;
    }
    // Return 500 when an unexpected error occurs
    const error = e as Error;
    log("Unexpected", error.message);
    res.status(500).json(error);
  }
};
