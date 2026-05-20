import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error("[ERROR]", err);
  const status = err.status || err.statusCode || 500;
  const message =
    status < 500
      ? err.message || "Request failed"
      : process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error";
  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
}
