/**
 * This is a custom error class that can be used to throw errors within the API
 * actions.
 * They are meant to be caught by the controller function and returned as JSON.
 */
class ActError extends Error {
  
  constructor(name: string, message: string, public code?: number) {
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


export default ActError;