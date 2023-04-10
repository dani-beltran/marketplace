/**
 * Function to log messages to the logging system.
 * At the moment is logging to the console, but the idea is to log to a logging system.
 * TODO: Implement logging to a logging system.
 * @param message
 * @param severity
 */
export const log = (
  code: string,
  message: string,
  severity: LogSeverity = "log",
  meta = {}
) => {
  const date = new Date();
  const timestamp = date.toISOString();
  message = `[${timestamp}] ${code}\n${message}`;
  switch (severity) {
    case "info":
      console.info(message, meta);
      break;
    case "warn":
      console.warn(message, meta);
      break;
    case "error":
      console.error(message, meta);
      break;
    default:
      console.log(message, meta);
  }
};

type LogSeverity = "log" | "info" | "warn" | "error";
