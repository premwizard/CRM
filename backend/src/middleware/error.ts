import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`API Error on [${req.method}] ${req.originalUrl}: ${message}`, {
    statusCode,
    code: err.code,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    ip: req.ip,
  });

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== "production" && { code: err.code }),
  });
};
