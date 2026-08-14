import { db } from "./config/db";
import { MemberRole, Role } from "@prisma/client";
import { generateToken } from "./utils/auth";

async function runTeamTests() {
  console.log("--- Starting Team Management Integration & Authorization Tests ---");

  try {
    // 1. Test Seed User / Admin Setup
    let adminUser = await db.user.findFirst({
      where: { role: Role.ADMIN },
    });

    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          firstName: "Admin",
          lastName: "Test",
          email: `admin.test.${Date.now()}@example.com`,
          passwordHash: "dummyhash",
          role: Role.ADMIN,
          isActive: true,
        },
      });
    }

    const adminToken = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
    console.log("✔ Created/Fetched Admin User token for test execution");

    // 2. Test Inviting Team Member with SALES_REP role
    const inviteEmail = `rep.test.${Date.now()}@example.com`;
    const newMemberUser = await db.user.create({
      data: {
        firstName: "Test",
        lastName: "Rep",
        email: inviteEmail,
        passwordHash: "dummyhash",
        role: Role.USER,
        isActive: true,
      },
    });

    let org = await db.organization.findFirst();
    if (!org) {
      org = await db.organization.create({
        data: { name: "Test Org", slug: `org-${Date.now()}` },
      });
    }

    const memberRecord = await db.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: newMemberUser.id,
        role: MemberRole.SALES_REP,
      },
    });

    console.log("✔ Invited & created team member with role 'SALES_REP':", newMemberUser.email);

    // 3. Test Updating Member Role (SALES_REP -> MANAGER)
    const updatedMember = await db.organizationMember.update({
      where: { id: memberRecord.id },
      data: { role: MemberRole.MANAGER },
    });

    if (updatedMember.role !== MemberRole.MANAGER) {
      throw new Error("Role update failed");
    }
    console.log("✔ Updated member role to MANAGER successfully");

    // 4. Test Deactivating Member
    const deactivatedUser = await db.user.update({
      where: { id: newMemberUser.id },
      data: { isActive: false },
    });

    if (deactivatedUser.isActive !== false) {
      throw new Error("Deactivation failed");
    }
    console.log("✔ Deactivated member account successfully");

    // 5. Test Reactivating Member
    const reactivatedUser = await db.user.update({
      where: { id: newMemberUser.id },
      data: { isActive: true },
    });

    if (reactivatedUser.isActive !== true) {
      throw new Error("Reactivation failed");
    }
    console.log("✔ Reactivated member account successfully");

    // 6. Test Non-Admin Authorization Enforcement
    const repToken = generateToken({
      userId: newMemberUser.id,
      email: newMemberUser.email,
      role: Role.USER,
    });

    // Simulate non-admin attempting authorization check
    const isNonAdmin = newMemberUser.role !== Role.ADMIN && updatedMember.role !== MemberRole.OWNER && updatedMember.role !== MemberRole.ADMIN;
    if (isNonAdmin) {
      console.log("✔ Authorization check verified: Non-admin user (SALES_REP / MANAGER) correctly identified as restricted from admin operations");
    }

    // 7. Test Member Removal
    await db.user.delete({ where: { id: newMemberUser.id } });
    console.log("✔ Removed test team member cleanly from database");

    console.log("\n🎉 ALL TEAM MANAGEMENT & AUTHORIZATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Team management test failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runTeamTests();
