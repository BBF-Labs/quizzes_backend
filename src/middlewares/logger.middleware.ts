import { Request, Response, NextFunction } from "express";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Config } from "../config";

const logger = createLogger({
  level: Config.LOG_LEVEL,
  format: format.combine(
    format.timestamp(),
    format.printf((info) => `${info.timestamp} [${info.level}] ${info.message}`)
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    new DailyRotateFile({
      filename: "logs/BBF-QBackend-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: Config.LOG_LEVEL,
    }),
  ],
});

function ErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(
    `Error: ${err.message} | URL: ${req.originalUrl} | IP: ${req.ip} | User-Agent: ${req.headers["user-agent"]}`
  );
  res
    .status(500)
    .json({ error: "Something went wrong. Please try again later." });

  next(err.message);
}

function Logger(req: Request, res: Response, next: NextFunction) {
  const { method, originalUrl, ip } = req;
  const userAgent = req.headers["user-agent"] || "unknown";
  res.on("finish", () => {
    logger.info(
      `${method} ${originalUrl} [${res.statusCode}] - IP: ${ip} - User-Agent: ${userAgent}`
    );
  });
  next();
}

export { ErrorHandler, Logger };
