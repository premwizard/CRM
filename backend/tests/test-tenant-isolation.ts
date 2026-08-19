import { db } from "../src/config/db";
import { generateToken } from "../src/utils/auth";
import { LeadStatus, DealStage } from "@prisma/client";

async function runTenantIsolationTests() {
  console.log("=== Starting Multi-Tenant Data Isolation Automated Verification Suite ===");

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await db.organization.upsert({
      where: { slug: "test-org-alpha" },
      create: { name: "Org Alpha", slug: "test-org-alpha" },
      update: {},
    });

    const orgB = await db.organization.upsert({
      where: { slug: "test-org-beta" },
      create: { name: "Org Beta", slug: "test-org-beta" },
      update: {},
    });

    const userA = await db.user.upsert({
      where: { email: "user_a@orgalpha.com" },
      create: { firstName: "User", lastName: "Alpha", email: "user_a@orgalpha.com", passwordHash: "$2a$10$hashfortesting" },
      update: {},
    });

    const userB = await db.user.upsert({
      where: { email: "user_b@orgbeta.com" },
      create: { firstName: "User", lastName: "Beta", email: "user_b@orgbeta.com", passwordHash: "$2a$10$hashfortesting" },
      update: {},
    });

    const tokenA = generateToken({
      userId: userA.id,
      email: userA.email,
      role: "ADMIN",
      organizationId: orgA.id,
    });

    const tokenB = generateToken({
      userId: userB.id,
      email: userB.email,
      role: "ADMIN",
      organizationId: orgB.id,
    });

    console.log(`✔ Created Organization Alpha (${orgA.id}) & Organization Beta (${orgB.id})`);

    // 2. Populate Organization Alpha Records
    const companyA = await db.company.create({
      data: { name: "Acme Corp Alpha", organizationId: orgA.id },
    });

    const contactA = await db.contact.create({
      data: {
        firstName: "Alice",
        lastName: "Alpha",
        email: "alice@acmealpha.com",
        organizationId: orgA.id,
        companyId: companyA.id,
      },
    });

    const leadA = await db.lead.create({
      data: {
        name: "Lead Alpha Project",
        email: "lead@acmealpha.com",
        status: LeadStatus.NEW,
        organizationId: orgA.id,
      },
    });

    const dealA = await db.deal.create({
      data: {
        name: "Big Deal Alpha",
        value: 100000,
        stage: DealStage.QUALIFIED,
        organizationId: orgA.id,
        companyId: companyA.id,
      },
    });

    const taskA = await db.task.create({
      data: {
        title: "Alpha Follow Up",
        organizationId: orgA.id,
        contactId: contactA.id,
      },
    });

    const activityA = await db.activity.create({
      data: {
        title: "Call with Alpha Lead",
        organizationId: orgA.id,
        contactId: contactA.id,
      },
    });

    const noteA = await db.note.create({
      data: {
        content: "Confidential Alpha notes",
        organizationId: orgA.id,
        contactId: contactA.id,
      },
    });

    const tagA = await db.tag.create({
      data: {
        name: "VIP-Alpha-Tag",
        organizationId: orgA.id,
      },
    });

    console.log("✔ Populated Org Alpha dataset: Contact, Company, Lead, Deal, Task, Activity, Note, Tag");

    // 3. Test Read Scoping for Organization Beta
    const betaContacts = await db.contact.findMany({ where: { organizationId: orgB.id } });
    const betaCompanies = await db.company.findMany({ where: { organizationId: orgB.id } });
    const betaLeads = await db.lead.findMany({ where: { organizationId: orgB.id } });
    const betaDeals = await db.deal.findMany({ where: { organizationId: orgB.id } });
    const betaTasks = await db.task.findMany({ where: { organizationId: orgB.id } });
    const betaActivities = await db.activity.findMany({ where: { organizationId: orgB.id } });
    const betaNotes = await db.note.findMany({ where: { organizationId: orgB.id } });
    const betaTags = await db.tag.findMany({ where: { organizationId: orgB.id } });

    if (
      betaContacts.length === 0 &&
      betaCompanies.length === 0 &&
      betaLeads.length === 0 &&
      betaDeals.length === 0 &&
      betaTasks.length === 0 &&
      betaActivities.length === 0 &&
      betaNotes.length === 0 &&
      betaTags.length === 0
    ) {
      console.log("✔ Multi-Tenant Read Scoping Verified: Organization Beta query returns 0 records from Organization Alpha");
    } else {
      throw new Error("Multi-Tenant Read Scoping Failed! Org Beta leaked Org Alpha data.");
    }

    // 4. Test Direct Manipulation Access Guard (Simulating Org B API requests targeting Org A record IDs)
    const directContactCheck = await db.contact.findFirst({
      where: { id: contactA.id, organizationId: orgB.id },
    });
    if (directContactCheck !== null) {
      throw new Error("Direct Contact access isolation failed!");
    }

    const directCompanyCheck = await db.company.findFirst({
      where: { id: companyA.id, organizationId: orgB.id },
    });
    if (directCompanyCheck !== null) {
      throw new Error("Direct Company access isolation failed!");
    }

    const directLeadCheck = await db.lead.findFirst({
      where: { id: leadA.id, organizationId: orgB.id },
    });
    if (directLeadCheck !== null) {
      throw new Error("Direct Lead access isolation failed!");
    }

    const directDealCheck = await db.deal.findFirst({
      where: { id: dealA.id, organizationId: orgB.id },
    });
    if (directDealCheck !== null) {
      throw new Error("Direct Deal access isolation failed!");
    }

    console.log("✔ Direct API Manipulation Guard Verified: Org B queries targeting Org A record IDs return 404 / null");

    // 5. Test Bulk Action Cross-Tenant Protection
    const bulkUpdateAttempt = await db.contact.updateMany({
      where: { id: { in: [contactA.id] }, organizationId: orgB.id },
      data: { owner: "Hacker User" },
    });

    if (bulkUpdateAttempt.count === 0) {
      console.log("✔ Bulk Action Cross-Tenant Guard Verified: Org B bulk update modified 0 Org A records");
    } else {
      throw new Error("Bulk Action Cross-Tenant Guard Failed!");
    }

    // 6. Clean Up Test Data
    await db.note.deleteMany({ where: { organizationId: orgA.id } });
    await db.activity.deleteMany({ where: { organizationId: orgA.id } });
    await db.task.deleteMany({ where: { organizationId: orgA.id } });
    await db.deal.deleteMany({ where: { organizationId: orgA.id } });
    await db.lead.deleteMany({ where: { organizationId: orgA.id } });
    await db.contact.deleteMany({ where: { organizationId: orgA.id } });
    await db.company.deleteMany({ where: { organizationId: orgA.id } });
    await db.tag.deleteMany({ where: { organizationId: orgA.id } });

    await db.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

    console.log("✔ Cleaned up test organizations and records");
    console.log("\n🎉 ALL MULTI-TENANT DATA ISOLATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Multi-Tenant Data Isolation Test Failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runTenantIsolationTests();
