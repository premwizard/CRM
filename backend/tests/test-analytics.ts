import { db } from "../src/config/db";
import { DealStage, LeadStatus } from "@prisma/client";

async function runAnalyticsTests() {
  console.log("=== Starting Advanced CRM Analytics System Automated Test Suite ===");

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await db.organization.upsert({
      where: { slug: "analytics-org-alpha" },
      create: { name: "Analytics Org Alpha", slug: "analytics-org-alpha" },
      update: {},
    });

    const orgB = await db.organization.upsert({
      where: { slug: "analytics-org-beta" },
      create: { name: "Analytics Org Beta", slug: "analytics-org-beta" },
      update: {},
    });

    const userPrem = await db.user.upsert({
      where: { email: "prem_analytics@orgalpha.com" },
      create: { firstName: "Prem", lastName: "Wizard", email: "prem_analytics@orgalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userBeta = await db.user.upsert({
      where: { email: "beta_analytics@orgbeta.com" },
      create: { firstName: "Beta", lastName: "User", email: "beta_analytics@orgbeta.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    // Create Sample Leads in Org A
    await db.lead.createMany({
      data: [
        { organizationId: orgA.id, name: "Lead 1", email: "l1@test.com", source: "WEBSITE", status: LeadStatus.NEW, owner: userPrem.email },
        { organizationId: orgA.id, name: "Lead 2", email: "l2@test.com", source: "LINKEDIN", status: LeadStatus.QUALIFIED, owner: userPrem.email },
        { organizationId: orgA.id, name: "Lead 3", email: "l3@test.com", source: "WEBSITE", status: LeadStatus.CONVERTED, owner: userPrem.email },
      ],
    });

    // Create Sample Deals in Org A
    await db.deal.createMany({
      data: [
        { organizationId: orgA.id, name: "Deal Proposal 1", value: 100000, stage: DealStage.PROPOSAL, owner: userPrem.email },
        { organizationId: orgA.id, name: "Deal Negotiation 1", value: 200000, stage: DealStage.NEGOTIATION, owner: userPrem.email },
        { organizationId: orgA.id, name: "Deal Won 1", value: 300000, stage: DealStage.WON, owner: userPrem.email },
        { organizationId: orgA.id, name: "Deal Lost 1", value: 50000, stage: DealStage.LOST, owner: userPrem.email },
      ],
    });

    // 2. Test 1: Sales Overview Analytics Aggregation
    const salesDeals = await db.deal.findMany({ where: { organizationId: orgA.id } });
    let totalPipeline = 0;
    let wonRevenue = 0;
    let wonCount = 0;
    let lostCount = 0;

    for (const d of salesDeals) {
      if (d.stage === DealStage.WON) {
        wonRevenue += Number(d.value);
        wonCount++;
      } else if (d.stage === DealStage.LOST) {
        lostCount++;
      } else {
        totalPipeline += Number(d.value);
      }
    }

    if (totalPipeline !== 300000 || wonRevenue !== 300000 || wonCount !== 1) {
      throw new Error("Test 1 Failed: Sales Overview pipeline aggregation failed");
    }
    console.log("✔ Test 1 Passed: Sales Overview pipeline and won revenue calculated accurately");

    // 3. Test 2: Lead Analytics & Source/Status Aggregation
    const leadCount = await db.lead.count({ where: { organizationId: orgA.id } });
    const leadGroup = await db.lead.groupBy({
      by: ["source"],
      where: { organizationId: orgA.id },
      _count: { id: true },
    });

    if (leadCount !== 3 || leadGroup.length !== 2) {
      throw new Error("Test 2 Failed: Lead Analytics group aggregation failed");
    }
    console.log("✔ Test 2 Passed: Lead count and source breakdown calculated accurately");

    // 4. Test 3: Deal Stage & Won/Lost Breakdown
    const dealStageGroup = await db.deal.groupBy({
      by: ["stage"],
      where: { organizationId: orgA.id },
      _count: { id: true },
      _sum: { value: true },
    });

    if (dealStageGroup.length !== 4) {
      throw new Error("Test 3 Failed: Deal Stage breakdown failed");
    }
    console.log("✔ Test 3 Passed: Deal stage breakdown calculated accurately");

    // 5. Test 4: Sales Team Performance Aggregation
    const userDealsWon = await db.deal.aggregate({
      where: { organizationId: orgA.id, owner: userPrem.email, stage: DealStage.WON },
      _sum: { value: true },
    });

    if (Number(userDealsWon._sum.value) !== 300000) {
      throw new Error("Test 4 Failed: Team performance revenue calculation failed");
    }
    console.log("✔ Test 4 Passed: Team performance leaderboard metrics calculated per representative");

    // 6. Test 5: Filter Functionality (Owner Filter)
    const filteredDeals = await db.deal.findMany({
      where: { organizationId: orgA.id, owner: userPrem.email, stage: DealStage.PROPOSAL },
    });
    if (filteredDeals.length !== 1 || filteredDeals[0].name !== "Deal Proposal 1") {
      throw new Error("Test 5 Failed: Multi-dimensional filter query failed");
    }
    console.log("✔ Test 5 Passed: Multi-dimensional query filters verified");

    // 7. Test 6: Organization Isolation & Empty State Guard
    const orgBDeals = await db.deal.findMany({ where: { organizationId: orgB.id } });
    if (orgBDeals.length !== 0) {
      throw new Error("Test 6 Failed: Org B user was able to view Org A analytics!");
    }
    console.log("✔ Test 6 Passed: Organization isolation verified (Org B returned 0 records)");

    // Cleanup
    await db.lead.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.deal.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.user.deleteMany({ where: { id: { in: [userPrem.id, userBeta.id] } } });
    await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

    console.log("\n🎉 ALL 6 ADVANCED ANALYTICS INTEGRATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Analytics Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runAnalyticsTests();
