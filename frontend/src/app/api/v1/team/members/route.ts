import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

// GET /api/v1/team/members
export async function GET() {
  try {
    const users = await db.user.findMany({
      include: {
        memberships: {
          include: { organization: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const invitations = await db.teamInvitation.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const membersList = users.map((u) => {
      const membership = u.memberships[0];
      const memberRole = membership
        ? membership.role
        : u.role === "ADMIN"
        ? MemberRole.ADMIN
        : MemberRole.SALES_REP;

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        role: memberRole,
        systemRole: u.role,
        isActive: u.isActive,
        status: u.isActive ? "ACTIVE" : "DEACTIVATED",
        joinedDate: u.createdAt.toISOString(),
        createdAt: u.createdAt.toISOString(),
        isPending: false,
      };
    });

    const pendingList = invitations.map((inv) => ({
      id: inv.id,
      firstName: "Invited",
      lastName: "Member",
      name: inv.email.split("@")[0],
      email: inv.email,
      role: inv.role,
      systemRole: "USER",
      isActive: false,
      status: "PENDING",
      joinedDate: inv.createdAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      isPending: true,
      token: inv.token,
    }));

    return apiSuccess({
      members: [...membersList, ...pendingList],
      totalMembers: membersList.length,
      totalPending: pendingList.length,
    });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch team members",
      500
    );
  }
}
