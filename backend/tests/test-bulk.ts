import { db } from "../src/config/db";
import { LeadStatus, DealStage } from "@prisma/client";

async function testBulkOperations() {
  console.log("--- Starting Bulk Actions Integration Test ---");

  try {
    // 1. Create seed records for testing bulk actions
    const contact1 = await db.contact.create({
      data: {
        firstName: "Rahul",
        lastName: "Sharma",
        email: `rahul.test.${Date.now()}@example.com`,
      },
    });

    const contact2 = await db.contact.create({
      data: {
        firstName: "Arun",
        lastName: "Kumar",
        email: `arun.test.${Date.now()}@example.com`,
      },
    });

    const contact3 = await db.contact.create({
      data: {
        firstName: "Priya",
        lastName: "Patel",
        email: `priya.test.${Date.now()}@example.com`,
      },
    });

    console.log("✔ Created test contacts:", [contact1.id, contact2.id, contact3.id]);

    // Test Bulk Assign Owner for Contacts
    const bulkOwnerRes = await db.contact.updateMany({
      where: { id: { in: [contact1.id, contact2.id, contact3.id] } },
      data: { owner: "Rahul" },
    });
    console.log("✔ Bulk assigned owner to contacts:", bulkOwnerRes.count === 3);

    // Test Bulk Add Tag for Contacts
    let testTag = await db.tag.findUnique({ where: { name: "VIP Test" } });
    if (!testTag) {
      testTag = await db.tag.create({ data: { name: "VIP Test", color: "#EC4899" } });
    }

    await db.$transaction([
      db.contactTag.upsert({
        where: { contactId_tagId: { contactId: contact1.id, tagId: testTag.id } },
        create: { contactId: contact1.id, tagId: testTag.id },
        update: {},
      }),
      db.contactTag.upsert({
        where: { contactId_tagId: { contactId: contact2.id, tagId: testTag.id } },
        create: { contactId: contact2.id, tagId: testTag.id },
        update: {},
      }),
    ]);
    console.log("✔ Bulk added tag 'VIP Test' to contacts");

    // Test Bulk Remove Tag
    await db.contactTag.deleteMany({
      where: { contactId: { in: [contact1.id, contact2.id] }, tagId: testTag.id },
    });
    console.log("✔ Bulk removed tag from contacts");

    // Test Bulk Delete Contacts
    const deleteRes = await db.contact.deleteMany({
      where: { id: { in: [contact1.id, contact2.id, contact3.id] } },
    });
    console.log("✔ Bulk deleted contacts:", deleteRes.count === 3);

    // 2. Create seed records for Leads
    const lead1 = await db.lead.create({
      data: { name: "Test Lead 1", status: LeadStatus.NEW, value: 5000 },
    });
    const lead2 = await db.lead.create({
      data: { name: "Test Lead 2", status: LeadStatus.NEW, value: 12000 },
    });

    console.log("✔ Created test leads:", [lead1.id, lead2.id]);

    // Test Bulk Change Status for Leads
    const leadStatusRes = await db.lead.updateMany({
      where: { id: { in: [lead1.id, lead2.id] } },
      data: { status: LeadStatus.QUALIFIED },
    });
    console.log("✔ Bulk updated lead statuses:", leadStatusRes.count === 2);

    // Test Bulk Delete Leads
    await db.lead.deleteMany({ where: { id: { in: [lead1.id, lead2.id] } } });
    console.log("✔ Bulk deleted leads");

    // 3. Create seed records for Deals
    const deal1 = await db.deal.create({
      data: { name: "Enterprise Plan Deal", value: 45000, stage: DealStage.NEW },
    });
    const deal2 = await db.deal.create({
      data: { name: "Custom Integration Deal", value: 30000, stage: DealStage.NEW },
    });

    console.log("✔ Created test deals:", [deal1.id, deal2.id]);

    // Test Bulk Change Stage for Deals in transaction
    await db.$transaction([
      db.deal.update({
        where: { id: deal1.id },
        data: { stage: DealStage.PROPOSAL, probability: 60, forecastCategory: "COMMIT" },
      }),
      db.deal.update({
        where: { id: deal2.id },
        data: { stage: DealStage.PROPOSAL, probability: 60, forecastCategory: "COMMIT" },
      }),
    ]);
    console.log("✔ Bulk updated deal stages in transaction safety mode");

    // Clean up test deals
    await db.deal.deleteMany({ where: { id: { in: [deal1.id, deal2.id] } } });
    console.log("✔ Cleaned up test deals");

    console.log("\n🎉 ALL BULK ACTION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Bulk operations test error:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

testBulkOperations();
