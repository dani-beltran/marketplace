import { NextApiRequest, NextApiResponse } from "next";
import { ValidationError, Schema } from "yup";
import { log } from "./logging";
import {
  isDeadlockError,
  isForeignKeyConstraintViolation,
  isMissingRelatedRecord,
  isUniqueConstraintViolation,
} from "./db-helpers";
import { Dictionary } from "lodash";
import ActionError from "./ActionError";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { Session } from "next-auth";
import { Role } from "@/models/user";
import { monitor } from "./monitoring";

type ControllerParams<T_Input, T_Output> = {
  authentication?: Role[];
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
  session: Session | null;
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
  let statusCode = 500;
  const startTime = Date.now();
  try {
    // If authentication is required check there is a valid session
    let session: Session | null = null;
    if (authentication?.length) {
      session = await handleAuth(req, res, authentication);
    }
    // Validation is always required, validate the request body or query params
    const values = req.method === "GET" ? req.query : req.body;
    const validatedInput = await validation.schema.validate(values, {
      abortEarly: true,
      ...validation.options,
    });
    // Run the action
    const resBody = await action({ req, validatedInput, session });
    statusCode = 200;
    res.status(statusCode).json(resBody);
  } catch (e) {
    const error = e as Error;
    let errorResponse: Error;
    [statusCode, errorResponse] = getErrorResponse(req, error);
    log(errorResponse.name, errorResponse.message, "error");
    res.status(statusCode).json(errorResponse);
  } finally {
    monitor({
      startTime,
      statusCode,
      req,
    });
  }
};

/**
 * This function handles the authentication of a request.
 * @param req
 * @param res
 * @param allowedRoles The user roles that are allowed to access this resource
 * @returns the user session
 * @throws ActionError if the user is not logged in or does not have the required role
 */
const handleAuth = async (
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: Role[]
) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    throw new ActionError(
      "Unauthorized",
      "You must be logged in to access this resource."
    );
  }
  // Check the user has the required role. Admins can access all resources.
  const userRole = session.user.role;
  if (!allowedRoles.includes(userRole) && userRole !== Role.admin) {
    throw new ActionError(
      "Forbidden",
      "You are not authorized to access this resource."
    );
  }
  return session;
};

/**
 * Analyzes the raw error and the request, and returns the appropriate response
 * status code and error response body.
 * @param req Next.js HTTP Request
 * @param e Raw error
 * @returns [number, Error] The status code and error response body
 */
const getErrorResponse = (req: NextApiRequest, e: Error): [number, Error] => {
  // Catch ActionErrors and return them as JSON
  if (e instanceof ActionError) {
    return [e.getStatus(), e.toJSON()];
  }
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
  if (isForeignKeyConstraintViolation(e) || isUniqueConstraintViolation(e)) {
    return [
      409,
      {
        name: "ForeignKeyConstraintViolation",
        message: "Violates a foreign key constraint, like uniqueness",
      },
    ];
  }
  // Return 400 when a missing related record error occurs
  if (isMissingRelatedRecord(e)) {
    if (req.method === "DELETE") {
      return [
        404,
        {
          name: "NotFound",
          message: "The record does not exist",
        },
      ];
    }
    return [
      400,
      {
        name: "MissingRelatedRecord",
        message: "One or more of the related records does not exist",
      },
    ];
  }
  // Return 503 when any temporary issue in our server or database occurs
  if (isDeadlockError(e)) {
    return [
      503,
      {
        name: "Overloaded",
        message: "Our service is overloaded, please try again later",
      },
    ];
  }
  // Return 500 when an unexpected error occurs
  return [500, e];
};
