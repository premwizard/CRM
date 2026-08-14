import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { MemberRole, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

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

// POST /api/v1/team/invite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, role } = body;

    if (!email) {
      return apiError("Email is required", 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetRole =
      role && Object.values(MemberRole).includes(role as MemberRole)
        ? (role as MemberRole)
        : MemberRole.SALES_REP;

    let existingUser = await db.user.findUnique({ where: { email: cleanEmail } });

    if (existingUser) {
      let org = await db.organization.findFirst();
      if (!org) {
        org = await db.organization.create({
          data: { name: "Default Organization", slug: `org-${Date.now()}` },
        });
      }

      await db.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: existingUser.id,
          },
        },
        create: { organizationId: org.id, userId: existingUser.id, role: targetRole },
        update: { role: targetRole },
      });

      await db.user.update({
        where: { id: existingUser.id },
        data: { role: mapMemberRoleToUserRole(targetRole) },
      });

      return apiSuccess(
        { memberId: existingUser.id },
        `Updated role for existing user ${cleanEmail}`
      );
    }

    const tempPassword = `WelcomePass${Math.floor(1000 + Math.random() * 9000)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const fName = firstName ? firstName.trim() : cleanEmail.split("@")[0];
    const lName = lastName ? lastName.trim() : "Member";

    const newUser = await db.user.create({
      data: {
        email: cleanEmail,
        firstName: fName,
        lastName: lName,
        passwordHash,
        role: mapMemberRoleToUserRole(targetRole),
        isActive: true,
      },
    });

    let org = await db.organization.findFirst();
    if (!org) {
      org = await db.organization.create({
        data: { name: "Default Organization", slug: `org-${Date.now()}` },
      });
    }

    await db.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: newUser.id,
        role: targetRole,
      },
    });

    const token = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.teamInvitation.create({
      data: {
        email: cleanEmail,
        role: targetRole,
        token,
        organizationId: org.id,
        status: "ACCEPTED",
        expiresAt,
      },
    });

    return apiSuccess(
      {
        user: {
          id: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          role: targetRole,
          tempPassword,
        },
      },
      `Invited ${cleanEmail} successfully`,
      201
    );
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to send invitation",
      500
    );
  }
}
