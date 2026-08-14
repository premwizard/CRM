import { db } from "../config/db";

export interface LogAuditParams {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

export async function logAudit(params: LogAuditParams) {
  try {
    if (!params.organizationId || !params.userId) {
      return null;
    }

    const auditEntry = await db.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action.toUpperCase(),
        entityType: params.entityType,
        entityId: String(params.entityId),
        description: params.description,
        oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
        newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });

    return auditEntry;
  } catch (err) {
    console.error("Failed to write audit log:", err);
    return null;
  }
}
