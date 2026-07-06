import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { handlePrismaError } from '../utils/handlePrismaError';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  // Default error values
  let statusCode = 500;
  let message = "Internal Server Error";
  const errorMessages = err?.message;

  // Handle custom application errors (e.g., 404, 401)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Prisma specific database errors
  else if (err?.constructor?.name?.startsWith('Prisma')) {
    const prismaError = handlePrismaError(err);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
  }

  // Log at a level that matches severity: expected 4xx are noise at `warn`,
  // unexpected 5xx get the full error (stack included) at `error`.
  const context = { statusCode, method: req.method, path: req.originalUrl };
  if (statusCode >= 500) {
    logger.error({ ...context, err }, message);
  } else {
    logger.warn(context, message);
  }

  const isDev = process.env.NODE_ENV === "development";

  // Send the safe, mapped message — never the raw DB/error string, which would
  // leak internals. Raw details are exposed only in development.
  res.status(statusCode).json({
    success: false,
    message: message || errorMessages,
    errorDetails: {
      originalMessage: isDev ? errorMessages : undefined,
    },
    stack: isDev ? err?.stack : undefined,
  });
};