import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { MemberRole, Role } from "@prisma/client";

export function isReadOperation(method: string): boolean {
  return method.toUpperCase() === "GET" || method.toUpperCase() === "HEAD";
}

export function normalizeRole(roleString?: string): string {
  if (!roleString) return "SALES_REP";
  const r = roleString.toUpperCase().trim();
  if (r === "SUPER_ADMIN" || r === "ADMIN") return "ADMIN";
  if (r === "OWNER") return "OWNER";
  if (r === "MANAGER") return "MANAGER";
  if (r === "VIEWER") return "VIEWER";
  return "SALES_REP";
}

// 1. Middleware: Restrict VIEWER role from write operations (POST, PUT, DELETE, PATCH)
export function requireWritePermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (isReadOperation(req.method)) {
    return next();
  }

  const role = normalizeRole(req.user?.role);
  if (role === "VIEWER") {
    return res.status(403).json({
      success: false,
      error: "Read-only access: VIEWER role cannot perform mutation operations",
    });
  }

  next();
}

// 2. Middleware: Restrict DELETE operations to MANAGER, ADMIN, OWNER
export function requireDeletePermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const role = normalizeRole(req.user?.role);
  if (!["ADMIN", "OWNER", "MANAGER"].includes(role)) {
    return res.status(403).json({
      success: false,
      error: "Insufficient permissions: Delete operations require MANAGER, ADMIN, or OWNER role",
    });
  }

  next();
}

// 3. Middleware: Restrict Administrative / Settings / Team endpoints to ADMIN & OWNER
export function requireAdminPermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const role = normalizeRole(req.user?.role);
  if (!["ADMIN", "OWNER"].includes(role)) {
    return res.status(403).json({
      success: false,
      error: "Insufficient permissions: Only Admins or Owners can perform this action",
    });
  }

  next();
}

// 4. Flexible Role Checker Middleware
export function requireRoles(allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = normalizeRole(req.user?.role);
    if (!normalizedAllowed.includes(role)) {
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions: Action requires one of [${allowedRoles.join(", ")}] roles`,
      });
    }
    next();
  };
}
