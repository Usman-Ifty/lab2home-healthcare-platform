import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  stack?: string;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  const response: ErrorResponse = {
    success: false,
    message,
  };
  
  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = err.toString();
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

// 404 Not Found handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

