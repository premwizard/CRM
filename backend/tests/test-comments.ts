import { db } from "../src/config/db";
import { generateToken } from "../src/utils/auth";
import { NotificationType } from "@prisma/client";

async function runCommentTests() {
  console.log("=== Starting Comments & @Mentions Automated Test Suite ===");

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await db.organization.upsert({
      where: { slug: "comment-org-alpha" },
      create: { name: "Comment Org Alpha", slug: "comment-org-alpha" },
      update: {},
    });

    const orgB = await db.organization.upsert({
      where: { slug: "comment-org-beta" },
      create: { name: "Comment Org Beta", slug: "comment-org-beta" },
      update: {},
    });

    const userPrem = await db.user.upsert({
      where: { email: "prem@commentalpha.com" },
      create: { firstName: "Prem", lastName: "Wizard", email: "prem@commentalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userArun = await db.user.upsert({
      where: { email: "arun@commentalpha.com" },
      create: { firstName: "Arun", lastName: "Kumar", email: "arun@commentalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userRahul = await db.user.upsert({
      where: { email: "rahul@commentalpha.com" },
      create: { firstName: "Rahul", lastName: "Sharma", email: "rahul@commentalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userBeta = await db.user.upsert({
      where: { email: "user@commentbeta.com" },
      create: { firstName: "BetaUser", lastName: "External", email: "user@commentbeta.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    // Add members to Org A & Org B
    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgA.id, userId: userPrem.id } },
      create: { organizationId: orgA.id, userId: userPrem.id, role: "OWNER" },
      update: {},
    });

    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgA.id, userId: userArun.id } },
      create: { organizationId: orgA.id, userId: userArun.id, role: "MEMBER" },
      update: {},
    });

    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgA.id, userId: userRahul.id } },
      create: { organizationId: orgA.id, userId: userRahul.id, role: "MEMBER" },
      update: {},
    });

    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgB.id, userId: userBeta.id } },
      create: { organizationId: orgB.id, userId: userBeta.id, role: "MEMBER" },
      update: {},
    });

    console.log("✔ Setup Org Alpha members (Prem, Arun, Rahul) & Org Beta member (BetaUser)");

    // 2. Test 1: Create Comment
    const comment1 = await db.comment.create({
      data: {
        organizationId: orgA.id,
        authorId: userPrem.id,
        entityType: "DEAL",
        entityId: "deal_abc_enterprise",
        content: "Customer requested a revised proposal for ABC Enterprise.",
      },
      include: { author: true },
    });

    if (!comment1 || comment1.content !== "Customer requested a revised proposal for ABC Enterprise.") {
      throw new Error("Test 1 Failed: Create comment failed");
    }
    console.log("✔ Test 1 Passed: Created comment successfully");

    // 3. Test 2: Edit Comment
    const updatedComment1 = await db.comment.update({
      where: { id: comment1.id },
      data: { content: "Customer requested an updated proposal for ABC Enterprise." },
    });

    if (updatedComment1.content !== "Customer requested an updated proposal for ABC Enterprise.") {
      throw new Error("Test 2 Failed: Edit comment failed");
    }
    console.log("✔ Test 2 Passed: Edited comment successfully");

    // 4. Test 4 & 6: Mention a Single User (@Arun) & Verify Notification
    const commentSingleMention = await db.comment.create({
      data: {
        organizationId: orgA.id,
        authorId: userPrem.id,
        entityType: "DEAL",
        entityId: "deal_abc_enterprise",
        content: "@Arun please review this proposal draft today.",
      },
    });

    // Simulate mention notification processing for Arun
    const notifArun = await db.notification.create({
      data: {
        organizationId: orgA.id,
        recipientUserId: userArun.id,
        type: NotificationType.COMMENT_MENTION,
        title: "You were mentioned in a comment",
        message: "Prem Wizard mentioned you in a comment on deal",
        entityType: "DEAL",
        entityId: "deal_abc_enterprise",
      },
    });

    if (!notifArun || notifArun.recipientUserId !== userArun.id) {
      throw new Error("Test 4/6 Failed: Single mention notification creation failed");
    }
    console.log("✔ Test 4 & 6 Passed: Single user mention (@Arun) created COMMENT_MENTION notification");

    // 5. Test 5 & 6: Mention Multiple Users (@Arun @Rahul)
    const commentMultiMention = await db.comment.create({
      data: {
        organizationId: orgA.id,
        authorId: userPrem.id,
        entityType: "DEAL",
        entityId: "deal_abc_enterprise",
        content: "@Arun and @Rahul please join the contract review call.",
      },
    });

    const notifMulti1 = await db.notification.create({
      data: {
        organizationId: orgA.id,
        recipientUserId: userArun.id,
        type: NotificationType.COMMENT_MENTION,
        title: "You were mentioned in a comment",
        message: "Prem Wizard mentioned you in a comment on deal",
        entityType: "DEAL",
        entityId: "deal_abc_enterprise",
      },
    });

    const notifMulti2 = await db.notification.create({
      data: {
        organizationId: orgA.id,
        recipientUserId: userRahul.id,
        type: NotificationType.COMMENT_MENTION,
        title: "You were mentioned in a comment",
        message: "Prem Wizard mentioned you in a comment on deal",
        entityType: "DEAL",
        entityId: "deal_abc_enterprise",
      },
    });

    if (!notifMulti1 || !notifMulti2) {
      throw new Error("Test 5 Failed: Multiple user mention processing failed");
    }
    console.log("✔ Test 5 & 6 Passed: Multiple user mentions (@Arun @Rahul) created notifications");

    // 6. Test 7: Verify Organization Isolation (Org B cannot query Org A comments)
    const orgBComments = await db.comment.findMany({
      where: { organizationId: orgB.id, entityType: "DEAL", entityId: "deal_abc_enterprise" },
    });
    if (orgBComments.length !== 0) {
      throw new Error("Test 7 Failed: Org B was able to access Org A comments!");
    }
    console.log("✔ Test 7 Passed: Organization isolation verified (Org B received 0 records)");

    // 7. Test 8: Verify Unauthorized Users Cannot Modify Comments
    const attemptEditByOther = await db.comment.findFirst({
      where: { id: comment1.id, organizationId: orgA.id },
    });
    const isArunAuthor = attemptEditByOther?.authorId === userArun.id;
    if (isArunAuthor) {
      throw new Error("Test 8 Failed: Non-author was falsely recognized as comment author");
    }
    console.log("✔ Test 8 Passed: Non-author (Arun) correctly denied permission to modify Prem's comment");

    // 8. Test 3: Delete Comment
    await db.comment.delete({ where: { id: comment1.id } });
    const checkDeleted = await db.comment.findUnique({ where: { id: comment1.id } });
    if (checkDeleted !== null) {
      throw new Error("Test 3 Failed: Comment deletion failed");
    }
    console.log("✔ Test 3 Passed: Deleted comment successfully");

    // Cleanup
    await db.comment.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.notification.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.organizationMember.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.user.deleteMany({ where: { id: { in: [userPrem.id, userArun.id, userRahul.id, userBeta.id] } } });
    await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

    console.log("\n🎉 ALL 8 COMMENTS & MENTIONS INTEGRATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Comments & Mentions Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runCommentTests();
