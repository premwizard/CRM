import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { MemberRole, Role } from "@prisma/client";

function mapMemberRoleToUserRole(memberRole: MemberRole): Role {
  switch (memberRole) {
    case MemberRole.OWNER:
    case MemberRole.ADMIN:
      return Role.ADMIN;
    case MemberRole.MANAGER:
      return Role.MANAGER;
    default:
      return Role.USER;
  }
}

// PUT /api/v1/team/members/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, isActive } = body;

    // 1. Role Update
    if (role !== undefined) {
      if (!Object.values(MemberRole).includes(role as MemberRole)) {
        return apiError("Valid role is required", 400);
      }

      const targetRole = role as MemberRole;
      const user = await db.user.findUnique({
        where: { id },
        include: { memberships: true },
      });

      if (!user) {
        return apiError("Team member not found", 404);
      }

      if (user.memberships.length > 0) {
        await db.organizationMember.update({
          where: { id: user.memberships[0].id },
          data: { role: targetRole },
        });
      }

      const updatedUser = await db.user.update({
        where: { id },
        data: { role: mapMemberRoleToUserRole(targetRole) },
      });

      return apiSuccess(
        { id: updatedUser.id, role: targetRole },
        `Updated role to ${targetRole}`
      );
    }

    // 2. Status Update (isActive)
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return apiError("isActive boolean is required", 400);
      }

      const user = await db.user.update({
        where: { id },
        data: { isActive },
      });

      return apiSuccess(
        { id: user.id, isActive: user.isActive },
        `User ${isActive ? "activated" : "deactivated"} successfully`
      );
    }

    return apiError("No valid update fields provided", 400);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to update team member",
      500
    );
  }
}

// DELETE /api/v1/team/members/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingInvitation = await db.teamInvitation.findUnique({
      where: { id },
    });
    if (existingInvitation) {
      await db.teamInvitation.delete({ where: { id } });
      return apiSuccess({}, "Invitation revoked");
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return apiError("Team member not found", 404);
    }

    await db.user.delete({ where: { id } });
    return apiSuccess({}, "Team member removed");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to remove team member",
      500
    );
  }
}
