import { Request } from "express";
import { db } from "../config/db";
import { verifyToken } from "../utils/auth";

export async function resolveTenantId(req: Request): Promise<string> {
  // 1. Check if token attached to req.user has organizationId
  const authReq = req as unknown as { user?: { userId?: string; organizationId?: string } };
  if (authReq.user?.organizationId) {
    return authReq.user.organizationId;
  }

  // 2. Check Authorization header
  const authHeader = req.headers["authorization"];
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    const payload = verifyToken(token);
    if (payload?.organizationId) {
      return payload.organizationId;
    }
    if (payload?.userId) {
      const membership = await db.organizationMember.findFirst({
        where: { userId: payload.userId },
      });
      if (membership) {
        return membership.organizationId;
      }
    }
  }

  // 3. Fallback to default organization
  let defaultOrg = await db.organization.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!defaultOrg) {
    defaultOrg = await db.organization.create({
      data: {
        name: "Default Organization",
        slug: "default-org",
        isActive: true,
      },
    });
  }

  return defaultOrg.id;
}
