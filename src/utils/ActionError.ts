/**
 * This is a custom error class that can be used to throw errors within the API
 * controllers.
 * @example 
 * try {
 *  throw new ActionError("BadRequest", "You cannot create a contract for yourself.");
 * } catch (e) {
 *  if (e instanceof ActionError) {
 *   res.status(e.getStatus()).json(e.toJSON());
 *  }
 * }
 *  
 * @context In this project these errors are meant to be thrown inside `runController`\'s callback `action`.
 * 
 * `runController` will catch these errors and send the corresponding HTTP error response.
 */
class ActionError extends Error {
  
  constructor(name: ActionErrorName, message: string, public code?: number) {
    super(message);
    this.name = name;
    this.code = code;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
    };
  }

  getStatus() {
    return this.code || this.inferStatusFromName();
  }

  private inferStatusFromName() {
    switch (this.name) {
      case "BadRequest":
        return 400;
      case "Unauthorized":
        return 401;
      case "Forbidden":
        return 403;
      case "NotFound":
        return 404;
      case "Conflict":
        return 409;
      case "InternalServerError":
        return 500;
      default:
        return 500;
    }
  }
}

export type ActionErrorName = "BadRequest" | "Unauthorized" | "Forbidden" | "NotFound" | "Conflict" | "InternalServerError";

export default ActionError;