import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error Middleware]', err);

  if (err instanceof ZodError) {
    const errorDetails = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorDetails,
    });
    return;
  }

  // Handle Mongoose CastError or ValidationError
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: 'Database validation failed',
      errors,
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: `Invalid ID format for field '${err.path}'`,
      errors: [`Cast to ObjectId failed for value '${err.value}'`],
    });
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}. Value already exists.`,
      errors: [`${field} must be unique`],
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [message],
  });
}
