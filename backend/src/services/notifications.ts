import { db } from "../config/db";
import { NotificationType } from "@prisma/client";

export interface CreateNotificationParams {
  organizationId: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    if (!params.organizationId || !params.recipientUserId) {
      return null;
    }

    const notification = await db.notification.create({
      data: {
        organizationId: params.organizationId,
        recipientUserId: params.recipientUserId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
      },
    });

    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

/**
 * Resolves user ID by string reference (User ID or Email) within the tenant
 */
export async function resolveUserId(userRef: string | undefined | null, organizationId: string): Promise<string | null> {
  if (!userRef) return null;

  // Check if userRef is direct user ID
  const directUser = await db.user.findUnique({ where: { id: userRef } });
  if (directUser) return directUser.id;

  // Check by email
  const emailUser = await db.user.findFirst({
    where: { email: userRef.trim().toLowerCase() },
  });
  if (emailUser) return emailUser.id;

  // Check by OrganizationMember
  const member = await db.organizationMember.findFirst({
    where: {
      organizationId,
      user: {
        OR: [
          { email: { contains: userRef, mode: "insensitive" } },
          { firstName: { contains: userRef, mode: "insensitive" } },
          { lastName: { contains: userRef, mode: "insensitive" } },
        ],
      },
    },
    include: { user: true },
  });

  return member ? member.userId : null;
}
