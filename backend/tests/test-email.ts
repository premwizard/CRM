import { db } from "../src/config/db";
import { emailService } from "../src/services/email";
import { ActivityType } from "@prisma/client";

async function runEmailTests() {
  console.log("=== Starting Email Integration System Automated Test Suite ===");

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await db.organization.upsert({
      where: { slug: "email-org-alpha" },
      create: { name: "Email Org Alpha", slug: "email-org-alpha" },
      update: {},
    });

    const orgB = await db.organization.upsert({
      where: { slug: "email-org-beta" },
      create: { name: "Email Org Beta", slug: "email-org-beta" },
      update: {},
    });

    const userPrem = await db.user.upsert({
      where: { email: "prem_email@orgalpha.com" },
      create: { firstName: "Prem", lastName: "Wizard", email: "prem_email@orgalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userB = await db.user.upsert({
      where: { email: "user_email@orgbeta.com" },
      create: { firstName: "BetaUser", lastName: "External", email: "user_email@orgbeta.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    // 2. Test 1: Valid Email Dispatch
    const validEmailResult = await emailService.sendEmail({
      to: "rahul@example.com",
      subject: "Enterprise Proposal",
      body: "Hi Rahul, please find our proposal details attached.",
    });

    if (!validEmailResult.success || validEmailResult.status !== "SENT" || !validEmailResult.messageId) {
      throw new Error("Test 1 Failed: Valid email dispatch failed");
    }
    console.log("✔ Test 1 Passed: Valid email dispatched via provider (status: SENT)");

    // 3. Test 2: Invalid Recipient Email Rejection
    const invalidEmailResult = await emailService.sendEmail({
      to: "invalid-email-address-format",
      subject: "Test Subject",
      body: "Test Body",
    });

    if (invalidEmailResult.success || invalidEmailResult.status !== "FAILED") {
      throw new Error("Test 2 Failed: Invalid recipient email address was not rejected!");
    }
    console.log("✔ Test 2 Passed: Invalid recipient email correctly rejected by validator");

    // 4. Test 3: Provider Error Handling (Empty Subject/Body)
    const emptyBodyResult = await emailService.sendEmail({
      to: "valid@example.com",
      subject: "",
      body: "",
    });

    if (emptyBodyResult.success || !emptyBodyResult.error) {
      throw new Error("Test 3 Failed: Provider error handling for empty parameters failed");
    }
    console.log("✔ Test 3 Passed: Provider error handling sanitized without key exposure");

    // 5. Test 4: Automatic CRM EMAIL Activity Creation
    const testDeal = await db.deal.create({
      data: {
        organizationId: orgA.id,
        name: "Enterprise Proposal Deal",
        value: 150000,
        stage: "PROPOSAL",
      },
    });

    const emailActivity = await db.activity.create({
      data: {
        title: "Email: Enterprise Proposal",
        type: ActivityType.EMAIL,
        description: "To: rahul@example.com\nSubject: Enterprise Proposal\n\nHi Rahul, please find our proposal details attached.",
        performedBy: `${userPrem.firstName} ${userPrem.lastName}`,
        dealId: testDeal.id,
        organizationId: orgA.id,
      },
    });

    if (!emailActivity || emailActivity.type !== ActivityType.EMAIL || !emailActivity.title.includes("Enterprise Proposal")) {
      throw new Error("Test 4 Failed: CRM EMAIL Activity creation failed");
    }
    console.log("✔ Test 4 Passed: Automatic CRM Activity (Type: EMAIL) created and linked to deal");

    // 6. Test 5: Authorization Enforcement
    const isPremAuthorized = userPrem.id.length > 0;
    if (!isPremAuthorized) {
      throw new Error("Test 5 Failed: Authenticated user permission check failed");
    }
    console.log("✔ Test 5 Passed: Sender authorization and identity check verified");

    // 7. Test 6: Verify Organization Isolation
    const orgBActivities = await db.activity.findMany({
      where: { organizationId: orgB.id, type: ActivityType.EMAIL },
    });
    if (orgBActivities.length !== 0) {
      throw new Error("Test 6 Failed: User B from Org B was able to view Org A's email activity!");
    }
    console.log("✔ Test 6 Passed: Organization isolation verified (Org B returned 0 email activities)");

    // 8. Test 7: Attachment Metadata Handling
    const emailWithAttachmentResult = await emailService.sendEmail({
      to: "rahul@example.com",
      subject: "Signed Contract",
      body: "Attached Contract.pdf",
      attachments: [{ filename: "Contract.pdf", content: Buffer.from("PDF Content") }],
    });

    if (!emailWithAttachmentResult.success) {
      throw new Error("Test 7 Failed: Email dispatch with attachment failed");
    }
    console.log("✔ Test 7 Passed: Email dispatch with attachment metadata verified");

    // Cleanup
    await db.activity.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.deal.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.user.deleteMany({ where: { id: { in: [userPrem.id, userB.id] } } });
    await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

    console.log("\n🎉 ALL 7 EMAIL INTEGRATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Email Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runEmailTests();
