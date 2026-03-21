import { NextFunction, Request, Response } from 'express';

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', error);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
}
