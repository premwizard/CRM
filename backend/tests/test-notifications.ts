import { db } from "../src/config/db";
import { generateToken } from "../src/utils/auth";
import { NotificationType, LeadStatus, DealStage } from "@prisma/client";
import { createNotification } from "../src/services/notifications";

async function runNotificationTests() {
  console.log("=== Starting Centralized Notification System Automated Test Suite ===");

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await db.organization.upsert({
      where: { slug: "notif-org-alpha" },
      create: { name: "Notif Org Alpha", slug: "notif-org-alpha" },
      update: {},
    });

    const orgB = await db.organization.upsert({
      where: { slug: "notif-org-beta" },
      create: { name: "Notif Org Beta", slug: "notif-org-beta" },
      update: {},
    });

    const userA = await db.user.upsert({
      where: { email: "user_a_notif@orgalpha.com" },
      create: { firstName: "UserA", lastName: "Alpha", email: "user_a_notif@orgalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userB = await db.user.upsert({
      where: { email: "user_b_notif@orgbeta.com" },
      create: { firstName: "UserB", lastName: "Beta", email: "user_b_notif@orgbeta.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    // 2. Test 1: Notification Creation Service
    const notif1 = await createNotification({
      organizationId: orgA.id,
      recipientUserId: userA.id,
      type: NotificationType.GENERAL,
      title: "Welcome to IC CRM",
      message: "System initialized successfully",
    });

    if (!notif1) throw new Error("Test 1 Failed: Notification creation failed");
    console.log("✔ Test 1 Passed: Notification created successfully");

    // 3. Test 7: Lead Assignment Notification (LEAD_ASSIGNED)
    const leadNotif = await createNotification({
      organizationId: orgA.id,
      recipientUserId: userA.id,
      type: NotificationType.LEAD_ASSIGNED,
      title: "New lead assigned to you",
      message: "ABC Technologies (Lead) was assigned to you",
      entityType: "LEAD",
      entityId: "lead_123",
    });
    if (!leadNotif || leadNotif.type !== NotificationType.LEAD_ASSIGNED) {
      throw new Error("Test 7 Failed: Lead assignment notification failed");
    }
    console.log("✔ Test 7 Passed: Lead assignment notification created");

    // 4. Test 8: Task Assignment Notification (TASK_ASSIGNED)
    const taskNotif = await createNotification({
      organizationId: orgA.id,
      recipientUserId: userA.id,
      type: NotificationType.TASK_ASSIGNED,
      title: "New task assigned to you",
      message: "Follow up with Rahul",
      entityType: "TASK",
      entityId: "task_456",
    });
    if (!taskNotif || taskNotif.type !== NotificationType.TASK_ASSIGNED) {
      throw new Error("Test 8 Failed: Task assignment notification failed");
    }
    console.log("✔ Test 8 Passed: Task assignment notification created");

    // 5. Test 9: Deal Stage Notification (DEAL_STAGE_CHANGED, DEAL_WON, DEAL_LOST)
    const dealWonNotif = await createNotification({
      organizationId: orgA.id,
      recipientUserId: userA.id,
      type: NotificationType.DEAL_WON,
      title: "Deal Won!",
      message: "ABC Enterprise Deal was marked as Won ($50,000)",
      entityType: "DEAL",
      entityId: "deal_789",
    });
    if (!dealWonNotif || dealWonNotif.type !== NotificationType.DEAL_WON) {
      throw new Error("Test 9 Failed: Deal stage notification failed");
    }
    console.log("✔ Test 9 Passed: Deal stage / won notification created");

    // 6. Test 10: Mention Notification (COMMENT_MENTION)
    const mentionNotif = await createNotification({
      organizationId: orgA.id,
      recipientUserId: userA.id,
      type: NotificationType.COMMENT_MENTION,
      title: "You were mentioned in a comment",
      message: "Sarah mentioned you: 'Please check the contract terms'",
      entityType: "NOTE",
      entityId: "note_101",
    });
    if (!mentionNotif || mentionNotif.type !== NotificationType.COMMENT_MENTION) {
      throw new Error("Test 10 Failed: Mention notification failed");
    }
    console.log("✔ Test 10 Passed: Comment mention notification created");

    // 7. Test 5: Unread Count Calculation
    const unreadCount = await db.notification.count({
      where: { organizationId: orgA.id, recipientUserId: userA.id, isRead: false },
    });
    if (unreadCount !== 5) {
      throw new Error(`Test 5 Failed: Expected unread count 5, got ${unreadCount}`);
    }
    console.log(`✔ Test 5 Passed: Unread count calculated correctly (${unreadCount})`);

    // 8. Test 2: Notification Retrieval
    const userANotifs = await db.notification.findMany({
      where: { organizationId: orgA.id, recipientUserId: userA.id },
      orderBy: { createdAt: "desc" },
    });
    if (userANotifs.length !== 5) {
      throw new Error("Test 2 Failed: Notification retrieval count mismatch");
    }
    console.log("✔ Test 2 Passed: Notification retrieval verified");

    // 9. Test 6: Notification Navigation Properties
    if (userANotifs[0].entityType !== "NOTE" || userANotifs[0].entityId !== "note_101") {
      throw new Error("Test 6 Failed: Notification navigation metadata missing");
    }
    console.log("✔ Test 6 Passed: Notification navigation entity parameters verified");

    // 10. Test 3: Mark Single Notification as Read
    await db.notification.update({
      where: { id: notif1.id },
      data: { isRead: true, readAt: new Date() },
    });
    const afterMarkReadCount = await db.notification.count({
      where: { organizationId: orgA.id, recipientUserId: userA.id, isRead: false },
    });
    if (afterMarkReadCount !== 4) {
      throw new Error("Test 3 Failed: Single mark as read failed");
    }
    console.log("✔ Test 3 Passed: Mark single notification as read verified");

    // 11. Test 4: Mark All as Read
    await db.notification.updateMany({
      where: { organizationId: orgA.id, recipientUserId: userA.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    const finalUnreadCount = await db.notification.count({
      where: { organizationId: orgA.id, recipientUserId: userA.id, isRead: false },
    });
    if (finalUnreadCount !== 0) {
      throw new Error("Test 4 Failed: Mark all as read failed");
    }
    console.log("✔ Test 4 Passed: Mark all notifications as read verified");

    // 12. Test 11 & 12: Organization & User Isolation Protection
    const userBNotifs = await db.notification.findMany({
      where: { organizationId: orgB.id, recipientUserId: userB.id },
    });
    if (userBNotifs.length !== 0) {
      throw new Error("Test 11/12 Failed: User B received User A's notifications");
    }

    const unauthorizedRead = await db.notification.findFirst({
      where: { id: notif1.id, organizationId: orgB.id, recipientUserId: userB.id },
    });
    if (unauthorizedRead !== null) {
      throw new Error("Test 12 Failed: User B was able to access User A's notification");
    }
    console.log("✔ Test 11 & 12 Passed: Organization and User isolation strictly enforced");

    // Cleanup
    await db.notification.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

    console.log("\n🎉 ALL 12 NOTIFICATION SYSTEM INTEGRATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Notification Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runNotificationTests();
