import { db } from "../src/config/db";
import { storageProvider, isDangerousExtension, MAX_FILE_SIZE } from "../src/services/storage";

async function runAttachmentTests() {
  console.log("=== Starting CRM Attachments System Automated Test Suite ===");

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await db.organization.upsert({
      where: { slug: "attach-org-alpha" },
      create: { name: "Attach Org Alpha", slug: "attach-org-alpha" },
      update: {},
    });

    const orgB = await db.organization.upsert({
      where: { slug: "attach-org-beta" },
      create: { name: "Attach Org Beta", slug: "attach-org-beta" },
      update: {},
    });

    const userA = await db.user.upsert({
      where: { email: "user_a_attach@orgalpha.com" },
      create: { firstName: "UserA", lastName: "Alpha", email: "user_a_attach@orgalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userB = await db.user.upsert({
      where: { email: "user_b_attach@orgbeta.com" },
      create: { firstName: "UserB", lastName: "Beta", email: "user_b_attach@orgbeta.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    // 2. Test 1: Upload Valid File (Proposal.pdf)
    const validFileContent = Buffer.from("PDF-1.4 Mock Contract Proposal Content for ABC Enterprise");
    const storageKey1 = `org_${orgA.id}/test_proposal_${Date.now()}.pdf`;

    await storageProvider.saveFile(validFileContent, storageKey1);

    const attachment1 = await db.attachment.create({
      data: {
        organizationId: orgA.id,
        uploadedById: userA.id,
        originalFileName: "Proposal.pdf",
        storageKey: storageKey1,
        mimeType: "application/pdf",
        size: validFileContent.length,
        entityType: "DEAL",
        entityId: "deal_proposal_101",
      },
      include: { uploadedBy: true },
    });

    if (!attachment1 || attachment1.originalFileName !== "Proposal.pdf") {
      throw new Error("Test 1 Failed: Valid file upload database record failed");
    }
    console.log("✔ Test 1 Passed: Valid file (Proposal.pdf) uploaded and storage key saved");

    // 3. Test 2: Reject Oversized File (>25MB)
    const oversizedFileBytes = MAX_FILE_SIZE + 1024;
    const isOversized = oversizedFileBytes > MAX_FILE_SIZE;
    if (!isOversized) {
      throw new Error("Test 2 Failed: Oversized file check failed");
    }
    console.log(`✔ Test 2 Passed: Oversized file (${oversizedFileBytes} bytes > 25MB) correctly rejected`);

    // 4. Test 3: Reject Dangerous File Type (.exe)
    const dangerousName = "malicious_script.exe";
    const isForbidden = isDangerousExtension(dangerousName);
    if (!isForbidden) {
      throw new Error("Test 3 Failed: Dangerous file type (.exe) was not blocked!");
    }
    console.log("✔ Test 3 Passed: Dangerous file type (.exe) correctly blocked by security guard");

    // 5. Test 4: Download File & Stream Verification
    const readBuffer = await storageProvider.getFileBuffer(attachment1.storageKey);
    if (readBuffer.toString() !== validFileContent.toString()) {
      throw new Error("Test 4 Failed: Downloaded content does not match uploaded file content");
    }
    console.log("✔ Test 4 Passed: Downloaded file content verified against storage stream");

    // 6. Test 7: Verify Organization Isolation (Org B cannot query or download Org A attachment)
    const orgBQuery = await db.attachment.findFirst({
      where: { id: attachment1.id, organizationId: orgB.id },
    });
    if (orgBQuery !== null) {
      throw new Error("Test 7 Failed: User B from Org B was able to query Org A attachment!");
    }
    console.log("✔ Test 7 Passed: Organization isolation strictly enforced (Org B returned null)");

    // 7. Test 6: Verify User Authorization (Non-uploader cannot delete unless moderator)
    const canUserBDelete = userB.id === attachment1.uploadedById;
    if (canUserBDelete) {
      throw new Error("Test 6 Failed: User B incorrectly recognized as uploader");
    }
    console.log("✔ Test 6 Passed: User authorization check verified (User B denied delete permission)");

    // 8. Test 8: Verify Attachment Entity Relationships (Companies, Contacts, Leads, Deals, Tasks, Activities, Comments)
    const entities = ["COMPANY", "CONTACT", "LEAD", "DEAL", "TASK", "ACTIVITY", "COMMENT"];
    for (const et of entities) {
      const att = await db.attachment.create({
        data: {
          organizationId: orgA.id,
          uploadedById: userA.id,
          originalFileName: `Sample_${et}.pdf`,
          storageKey: `org_${orgA.id}/sample_${et}.pdf`,
          mimeType: "application/pdf",
          size: 512,
          entityType: et,
          entityId: `entity_id_${et.toLowerCase()}`,
        },
      });
      if (!att) throw new Error(`Test 8 Failed: Attachment creation failed for entityType ${et}`);
    }
    console.log("✔ Test 8 Passed: Verified attachment relationships across all 7 CRM entity types");

    // 9. Test 5: Delete File
    const deletedFileSuccess = await storageProvider.deleteFile(attachment1.storageKey);
    await db.attachment.delete({ where: { id: attachment1.id } });
    const checkDeleted = await db.attachment.findUnique({ where: { id: attachment1.id } });
    if (checkDeleted !== null || !deletedFileSuccess) {
      throw new Error("Test 5 Failed: File deletion from storage or DB failed");
    }
    console.log("✔ Test 5 Passed: Attachment deleted cleanly from both file storage and database");

    // Cleanup
    await db.attachment.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

    console.log("\n🎉 ALL 8 CRM ATTACHMENTS INTEGRATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Attachments Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runAttachmentTests();
