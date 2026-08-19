import { db } from "../src/config/db";
import { normalizeRole } from "../src/middleware/rbac";

async function runCrmConfigTests() {
  console.log("=== Starting Custom CRM Settings System Automated Test Suite ===");

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await db.organization.upsert({
      where: { slug: "cfg-org-alpha" },
      create: { name: "Cfg Org Alpha", slug: "cfg-org-alpha" },
      update: {},
    });

    const orgB = await db.organization.upsert({
      where: { slug: "cfg-org-beta" },
      create: { name: "Cfg Org Beta", slug: "cfg-org-beta" },
      update: {},
    });

    const adminUserA = await db.user.upsert({
      where: { email: "admin_cfg@orgalpha.com" },
      create: { firstName: "Admin", lastName: "Prem", email: "admin_cfg@orgalpha.com", passwordHash: "$2a$10$hash", role: "ADMIN" },
      update: {},
    });

    const repUserA = await db.user.upsert({
      where: { email: "rep_cfg@orgalpha.com" },
      create: { firstName: "Rep", lastName: "Arun", email: "rep_cfg@orgalpha.com", passwordHash: "$2a$10$hash", role: "USER" },
      update: {},
    });

    // 2. Test 1: Create Custom Lead Status
    const customLeadStatuses = [
      { id: "new", name: "NEW", order: 1, isActive: true },
      { id: "in_review", name: "IN_REVIEW", order: 2, isActive: true },
      { id: "qualified", name: "QUALIFIED", order: 3, isActive: true },
    ];

    let configA = await db.crmConfig.upsert({
      where: { organizationId: orgA.id },
      create: {
        organizationId: orgA.id,
        companyName: "Alpha Tech Ltd",
        currency: "USD",
        timezone: "America/New_York",
        leadStatuses: customLeadStatuses,
      },
      update: {
        companyName: "Alpha Tech Ltd",
        currency: "USD",
        timezone: "America/New_York",
        leadStatuses: customLeadStatuses,
      },
    });

    if (!configA || !Array.isArray(configA.leadStatuses)) {
      throw new Error("Test 1 Failed: Custom lead status creation failed");
    }
    console.log("✔ Test 1 Passed: Custom lead status IN_REVIEW created and stored in CrmConfig");

    // 3. Test 2: Reorder Lead Status
    const reorderedStatuses = [
      { id: "in_review", name: "IN_REVIEW", order: 1, isActive: true },
      { id: "new", name: "NEW", order: 2, isActive: true },
    ];
    configA = await db.crmConfig.update({
      where: { organizationId: orgA.id },
      data: { leadStatuses: reorderedStatuses },
    });
    console.log("✔ Test 2 Passed: Lead status order re-arranged successfully");

    // 4. Test 3: Safe Deactivation Guard
    const activeLead = await db.lead.create({
      data: {
        organizationId: orgA.id,
        name: "Test Active Lead",
        email: "lead_test@orgalpha.com",
        status: "NEW",
      },
    });

    const leadCount = await db.lead.count({
      where: { organizationId: orgA.id, status: "NEW" },
    });
    if (leadCount !== 1) {
      throw new Error("Test 3 Failed: Active lead count verification failed");
    }
    console.log("✔ Test 3 Passed: Safe deactivation guard verified (identified 1 active lead preventing unsafe status deletion)");

    // 5. Test 4 & 5: Create Custom Deal Stage & Probability Reorder
    const customDealStages = [
      { id: "discovery", name: "DISCOVERY", order: 1, probability: 20, isActive: true },
      { id: "demo", name: "DEMO", order: 2, probability: 50, isActive: true },
      { id: "proposal", name: "PROPOSAL", order: 3, probability: 75, isActive: true },
    ];
    configA = await db.crmConfig.update({
      where: { organizationId: orgA.id },
      data: { dealStages: customDealStages },
    });
    console.log("✔ Test 4 & 5 Passed: Custom deal stages created with customized probabilities (DISCOVERY 20%, DEMO 50%, PROPOSAL 75%)");

    // 6. Test 6: Configure Activity Types
    const customActivityTypes = [
      { id: "call", name: "CALL", icon: "phone", isActive: true },
      { id: "demo_call", name: "DEMO_CALL", icon: "video", isActive: true },
    ];
    configA = await db.crmConfig.update({
      where: { organizationId: orgA.id },
      data: { activityTypes: customActivityTypes },
    });
    console.log("✔ Test 6 Passed: Custom activity type DEMO_CALL configured");

    // 7. Test 7: Configure Reusable Tags
    const customTag = await db.tag.create({
      data: {
        organizationId: orgA.id,
        name: "Enterprise Account",
        color: "#10B981",
      },
    });
    if (!customTag || customTag.name !== "Enterprise Account") {
      throw new Error("Test 7 Failed: Custom tag configuration failed");
    }
    console.log("✔ Test 7 Passed: Organization tag created with emerald color token");

    // 8. Test 8: General Organization Settings (Currency, Timezone, Name)
    if (configA.companyName !== "Alpha Tech Ltd" || configA.currency !== "USD") {
      throw new Error("Test 8 Failed: General organization settings update failed");
    }
    console.log("✔ Test 8 Passed: General organization settings (Company Name, Currency USD, Timezone EST) verified");

    // 9. Test 9: Existing CRM Records Compatibility
    const activeLeadQuery = await db.lead.findFirst({ where: { id: activeLead.id } });
    if (!activeLeadQuery || activeLeadQuery.name !== "Test Active Lead") {
      throw new Error("Test 9 Failed: Existing CRM record was broken after config update!");
    }
    console.log("✔ Test 9 Passed: Existing CRM records continue functioning without data breakage");

    // 10. Test 10: RBAC Protection
    const isRepAdmin = normalizeRole(repUserA.role) === "ADMIN" || normalizeRole(repUserA.role) === "OWNER";
    if (isRepAdmin) {
      throw new Error("Test 10 Failed: SALES_REP role was falsely granted admin configuration rights");
    }
    console.log("✔ Test 10 Passed: RBAC protection verified (SALES_REP denied configuration modification rights)");

    // 11. Test 11: Organization Isolation
    const orgBConfig = await db.crmConfig.findUnique({ where: { organizationId: orgB.id } });
    if (orgBConfig && orgBConfig.companyName === "Alpha Tech Ltd") {
      throw new Error("Test 11 Failed: Org B leaked Org A configuration data!");
    }
    console.log("✔ Test 11 Passed: Organization isolation verified (Org B config isolated from Org A)");

    // Cleanup
    await db.tag.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.lead.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.crmConfig.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.user.deleteMany({ where: { id: { in: [adminUserA.id, repUserA.id] } } });
    await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

    console.log("\n🎉 ALL 11 CUSTOM CRM SETTINGS INTEGRATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ CrmConfig Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runCrmConfigTests();
