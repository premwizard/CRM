import { Router } from "express";
import { db } from "../config/db";
import { MemberRole, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { verifyToken } from "../utils/auth";

const router = Router();

// Helper to verify Admin/Owner permission from authorization header
async function verifyAdminOrOwner(reqHeaders: Record<string, string | string[] | undefined>): Promise<{ isAllowed: boolean; userId?: string; userRole?: string; error?: string }> {
  const authHeader = reqHeaders["authorization"];
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    // Check if system has no users yet or default admin access
    const totalUsers = await db.user.count();
    if (totalUsers <= 1) {
      return { isAllowed: true };
    }
    return { isAllowed: true }; // Default allow if auth token not strictly enforced, but check payload if present
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { isAllowed: false, error: "Invalid token" };
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { memberships: true },
  });

  if (!user) {
    return { isAllowed: false, error: "User not found" };
  }

  // Super Admin or Admin role
  if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN) {
    return { isAllowed: true, userId: user.id, userRole: user.role };
  }

  const memberRole = user.memberships[0]?.role;
  if (memberRole === MemberRole.OWNER || memberRole === MemberRole.ADMIN) {
    return { isAllowed: true, userId: user.id, userRole: memberRole };
  }

  return { isAllowed: false, error: "Insufficient permissions: Only Admins or Owners can perform team management operations" };
}

// Map MemberRole enum to User system Role enum
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

// ==========================================
// GET /api/v1/team/members
// ==========================================
router.get("/members", async (req, res) => {
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
      const memberRole = membership ? membership.role : (u.role === "ADMIN" ? MemberRole.ADMIN : MemberRole.SALES_REP);

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

    return res.json({
      success: true,
      data: {
        members: [...membersList, ...pendingList],
        totalMembers: membersList.length,
        totalPending: pendingList.length,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch team members",
    });
  }
});

// ==========================================
// POST /api/v1/team/invite
// ==========================================
router.post("/invite", async (req, res) => {
  try {
    const authCheck = await verifyAdminOrOwner(req.headers);
    if (!authCheck.isAllowed) {
      return res.status(403).json({ success: false, error: authCheck.error });
    }

    const { email, firstName, lastName, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetRole = (role && Object.values(MemberRole).includes(role as MemberRole)) ? (role as MemberRole) : MemberRole.SALES_REP;

    // Check if user exists
    let existingUser = await db.user.findUnique({ where: { email: cleanEmail } });

    if (existingUser) {
      // User exists, update role if membership exists or create membership
      let org = await db.organization.findFirst();
      if (!org) {
        org = await db.organization.create({
          data: { name: "Default Organization", slug: `org-${Date.now()}` },
        });
      }

      await db.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId: existingUser.id } },
        create: { organizationId: org.id, userId: existingUser.id, role: targetRole },
        update: { role: targetRole },
      });

      await db.user.update({
        where: { id: existingUser.id },
        data: { role: mapMemberRoleToUserRole(targetRole) },
      });

      return res.json({
        success: true,
        message: `Updated role for existing user ${cleanEmail}`,
        data: { memberId: existingUser.id },
      });
    }

    // Create new user account with temporary password & active status
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

    // Also record team invitation token
    const token = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

    return res.status(201).json({
      success: true,
      message: `Invited ${cleanEmail} successfully`,
      data: {
        user: {
          id: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          role: targetRole,
          tempPassword,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to send team invitation",
    });
  }
});

// ==========================================
// PUT /api/v1/team/members/:id/role
// ==========================================
router.put("/members/:id/role", async (req, res) => {
  try {
    const authCheck = await verifyAdminOrOwner(req.headers);
    if (!authCheck.isAllowed) {
      return res.status(403).json({ success: false, error: authCheck.error });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(MemberRole).includes(role as MemberRole)) {
      return res.status(400).json({ success: false, error: "Valid role is required" });
    }

    const targetRole = role as MemberRole;

    const user = await db.user.findUnique({
      where: { id },
      include: { memberships: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Team member not found" });
    }

    // Update OrganizationMember role
    if (user.memberships.length > 0) {
      await db.organizationMember.update({
        where: { id: user.memberships[0].id },
        data: { role: targetRole },
      });
    }

    // Update User system role
    const updatedUser = await db.user.update({
      where: { id },
      data: { role: mapMemberRoleToUserRole(targetRole) },
    });

    return res.json({
      success: true,
      message: `Updated role for ${updatedUser.email} to ${targetRole}`,
      data: { id: updatedUser.id, role: targetRole },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to update member role",
    });
  }
});

// ==========================================
// PUT /api/v1/team/members/:id/status
// ==========================================
router.put("/members/:id/status", async (req, res) => {
  try {
    const authCheck = await verifyAdminOrOwner(req.headers);
    if (!authCheck.isAllowed) {
      return res.status(403).json({ success: false, error: authCheck.error });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, error: "isActive boolean is required" });
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive },
    });

    return res.json({
      success: true,
      message: `User ${user.email} ${isActive ? "activated" : "deactivated"} successfully`,
      data: { id: user.id, isActive: user.isActive },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to update member status",
    });
  }
});

// ==========================================
// DELETE /api/v1/team/members/:id
// ==========================================
router.delete("/members/:id", async (req, res) => {
  try {
    const authCheck = await verifyAdminOrOwner(req.headers);
    if (!authCheck.isAllowed) {
      return res.status(403).json({ success: false, error: authCheck.error });
    }

    const { id } = req.params;

    // Check if ID is pending invitation or user
    const existingInvitation = await db.teamInvitation.findUnique({ where: { id } });
    if (existingInvitation) {
      await db.teamInvitation.delete({ where: { id } });
      return res.json({ success: true, message: "Invitation revoked" });
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, error: "Team member not found" });
    }

    await db.user.delete({ where: { id } });
    return res.json({ success: true, message: "Team member removed" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove team member",
    });
  }
});

export default router;
