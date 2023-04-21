import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { ObjectSchema, ValidationError, Schema } from "yup";
import { log } from "./logging";
import { Prisma } from "@/lib/prisma-client";
import {
  isForeignKeyConstraintViolation,
  isMissingRelatedRecord,
  isUniqueConstraintViolation,
} from "./db-helpers";
import { Dictionary } from "lodash";
import ActionError from "./ActionError";

type ControllerParams<T_Input, T_Output> = {
  authentication?: boolean;
  validation: {
    schema: Schema<T_Input>;
    options?: { abortEarly?: boolean };
  };
  req: NextApiRequest;
  res: NextApiResponse;
  action: (
    req: NextApiRequest,
    validatedInput: Awaited<T_Input>
  ) => Promise<T_Output>;
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
  // userId header is reserved for authentication results, whatever is coming from
  // the client should be removed to prevent abuse.
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
  // Validation is always required, validate the request body or query params
  try {
    const values = req.method === "GET" ? req.query : req.body;
    const validatedInput = await validation.schema.validate(values, {
      abortEarly: true,
      ...validation.options,
    });
    // Run the action
    const resBody = await action(req, validatedInput);
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
