import * as winston from "winston";

// Logger configuration constants
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const LOG_FORMAT = "YYYY-MM-DD HH:mm:ss.SSSZZ";

const { splat, combine, timestamp, printf } = winston.format;

const customFormat = printf(
  ({ timestamp, level, message, meta }: winston.Logform.TransformableInfo) => {
    return `[${timestamp}] [${level.toUpperCase()}]  ${message}  ${
      meta ? JSON.stringify(meta) : ""
    }`;
  }
);

export const logger = winston.createLogger({
  handleExceptions: true,
  level: LOG_LEVEL,
  format: combine(timestamp({ format: LOG_FORMAT }), splat(), customFormat),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      format: winston.format.combine(winston.format.colorize(), customFormat),
    }),
  ],
  exitOnError: false,
});
