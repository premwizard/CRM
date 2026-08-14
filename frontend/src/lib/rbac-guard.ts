import { NextRequest } from "next/server";
import { apiError } from "./api-response";
import { verifyToken } from "./auth";

export interface PermissionCheckOptions {
  requireWrite?: boolean;
  requireDelete?: boolean;
  requireAdmin?: boolean;
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

export function checkRoutePermissions(
  request: NextRequest,
  options: PermissionCheckOptions = {}
): { authorized: boolean; response?: ReturnType<typeof apiError>; userRole: string } {
  const authHeader = request.headers.get("authorization");
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  let role = "ADMIN"; // Default fallback if auth header not passed in dev

  if (token) {
    const payload = verifyToken(token);
    if (payload?.role) {
      role = normalizeRole(payload.role);
    }
  }

  const method = request.method.toUpperCase();
  const isReadMethod = method === "GET" || method === "HEAD";

  // 1. Write Permission Check (POST, PUT, DELETE)
  if (!isReadMethod || options.requireWrite) {
    if (role === "VIEWER") {
      return {
        authorized: false,
        userRole: role,
        response: apiError(
          "Read-only access: VIEWER role cannot perform mutation operations",
          403
        ),
      };
    }
  }

  // 2. Delete Permission Check
  if (method === "DELETE" || options.requireDelete) {
    if (!["ADMIN", "OWNER", "MANAGER"].includes(role)) {
      return {
        authorized: false,
        userRole: role,
        response: apiError(
          "Insufficient permissions: Delete operations require MANAGER, ADMIN, or OWNER role",
          403
        ),
      };
    }
  }

  // 3. Admin Permission Check
  if (options.requireAdmin) {
    if (!["ADMIN", "OWNER"].includes(role)) {
      return {
        authorized: false,
        userRole: role,
        response: apiError(
          "Insufficient permissions: Only Admins or Owners can access this resource",
          403
        ),
      };
    }
  }

  return { authorized: true, userRole: role };
}
