import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Use existing correlation ID from headers or generate new one
  req.correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();

  // Add to response headers for tracing
  res.setHeader("x-correlation-id", req.correlationId);

  next();
};
