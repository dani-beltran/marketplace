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
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { Session } from "next-auth";

type ControllerParams<T_Input, T_Output> = {
  authentication?: boolean;
  validation: {
    schema: Schema<T_Input>;
    options?: { abortEarly?: boolean };
  };
  req: NextApiRequest;
  res: NextApiResponse;
  action: (params: ActionParams<T_Input>) => Promise<T_Output>;
};

type ActionParams<T_Input> = {
  req: NextApiRequest;
  validatedInput: Awaited<T_Input>;
  session?: Session;
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
    const resBody = await action({ req, validatedInput, session });
    res.status(200).json(resBody);
  } catch (e) {
    const error = e as Error;
    const [statusCode, errorResponse] = getErrorResponse(req, error);
    log(errorResponse.name, errorResponse.message, "error");
    res.status(statusCode).json(errorResponse);
  }
};

/**
 * Analyzes the raw error and the request, and returns the appropriate response 
 * status code and error response body.
 * @param req Next.js HTTP Request
 * @param e Raw error
 * @returns [number, Error] The status code and error response body
 */
const getErrorResponse = (req: NextApiRequest, e: Error): [number, Error] => {
  // Return 400 when a validation error occurs
  if (e instanceof ValidationError) {
    return [
      400,
      {
        name: "ValidationError",
        message: e.message,
      },
    ];
  }
  // Return 409 when a foreign key constraint violation occurs
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    (isForeignKeyConstraintViolation(e) || isUniqueConstraintViolation(e))
  ) {
    return [409,{
      name: "ForeignKeyConstraintViolation",
      message: "Violates a foreign key constraint, like uniqueness",
    }];
  }
  // Return 400 when a missing related record error occurs
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    isMissingRelatedRecord(e)
  ) {
    if (req.method === "DELETE") {
      return [404, {
        name: "NotFound",
        message: "The record does not exist",
      }];
    }
    return [400, {
      name: "MissingRelatedRecord",
      message: "One or more of the related records does not exist",
    }];
  }
  // Catch ActionErrors and return them as JSON
  if (e instanceof ActionError) {
    return [e.getStatus(), e.toJSON()];
  }
  // Return 500 when an unexpected error occurs
  return [500, e];
};
