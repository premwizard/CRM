import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Access token missing or invalid" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res
      .status(401)
      .json({ success: false, error: "Token invalid or expired" });
  }

  req.user = payload;
  next();
}
