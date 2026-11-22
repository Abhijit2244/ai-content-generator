import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { sendError } from '../http/response.js';
import { logger } from '../../config/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';

  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    logger.warn('Validation error', { requestId, issues });
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', issues);
    return;
  }

  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
    });
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  logger.error('Unhandled server error', {
    requestId,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  sendError(res, 'An unexpected server error occurred', 500, 'INTERNAL_SERVER_ERROR');
}
