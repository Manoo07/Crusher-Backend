import winston from "winston";

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
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    splat(),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      format: winston.format.combine(winston.format.colorize(), customFormat),
    }),
  ],
  exitOnError: false,
});
