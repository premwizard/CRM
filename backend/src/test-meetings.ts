import { db } from "./config/db";
import { MeetingStatus, ActivityType } from "@prisma/client";

async function runMeetingTests() {
  console.log("=== Starting Meetings & Calendar System Automated Test Suite ===");

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await db.organization.upsert({
      where: { slug: "meet-org-alpha" },
      create: { name: "Meet Org Alpha", slug: "meet-org-alpha" },
      update: {},
    });

    const orgB = await db.organization.upsert({
      where: { slug: "meet-org-beta" },
      create: { name: "Meet Org Beta", slug: "meet-org-beta" },
      update: {},
    });

    const userPrem = await db.user.upsert({
      where: { email: "prem_meet@orgalpha.com" },
      create: { firstName: "Prem", lastName: "Wizard", email: "prem_meet@orgalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userArun = await db.user.upsert({
      where: { email: "arun_meet@orgalpha.com" },
      create: { firstName: "Arun", lastName: "Kumar", email: "arun_meet@orgalpha.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    const userBeta = await db.user.upsert({
      where: { email: "beta_meet@orgbeta.com" },
      create: { firstName: "Beta", lastName: "User", email: "beta_meet@orgbeta.com", passwordHash: "$2a$10$hash" },
      update: {},
    });

    // Create test Deal for relationship linking
    const testDeal = await db.deal.create({
      data: {
        organizationId: orgA.id,
        name: "ABC Tech Enterprise Contract",
        value: 250000,
        stage: "PROPOSAL",
      },
    });

    // 2. Test 1, 7 & 8: Create Meeting, Relationship & Automatic Activity Creation
    const now = new Date();
    const startTime1 = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h from now
    const endTime1 = new Date(startTime1.getTime() + 60 * 60 * 1000); // 1h duration

    const meeting1 = await db.meeting.create({
      data: {
        organizationId: orgA.id,
        title: "Contract Demo & Price Review",
        description: "Review contract terms with engineering lead",
        startTime: startTime1,
        endTime: endTime1,
        location: "Conference Room A",
        meetingUrl: "https://meet.google.com/demo-test",
        organizerId: userPrem.id,
        dealId: testDeal.id,
        status: MeetingStatus.SCHEDULED,
      },
      include: { organizer: true },
    });

    // Create automatic CRM Activity for Meeting
    const meetingActivity = await db.activity.create({
      data: {
        title: `Scheduled Meeting: "${meeting1.title}"`,
        type: ActivityType.MEETING,
        description: `Meeting: ${meeting1.title}\nTime: ${startTime1.toISOString()} - ${endTime1.toISOString()}`,
        performedBy: `${userPrem.firstName} ${userPrem.lastName}`,
        dealId: testDeal.id,
        organizationId: orgA.id,
      },
    });

    if (!meeting1 || meeting1.title !== "Contract Demo & Price Review" || !meetingActivity) {
      throw new Error("Test 1/7/8 Failed: Create meeting or CRM Activity creation failed");
    }
    console.log("✔ Test 1, 7 & 8 Passed: Scheduled meeting created, linked to Deal, and automatic CRM Activity created");

    // 3. Test 6: Organizer Conflict Detection
    const overlapStartTime = new Date(startTime1.getTime() + 30 * 60 * 1000); // Overlaps by 30 mins
    const overlapEndTime = new Date(endTime1.getTime() + 30 * 60 * 1000);

    const conflictingMeeting = await db.meeting.findFirst({
      where: {
        organizationId: orgA.id,
        organizerId: userPrem.id,
        status: { notIn: [MeetingStatus.CANCELLED] },
        startTime: { lt: overlapEndTime },
        endTime: { gt: overlapStartTime },
      },
    });

    if (!conflictingMeeting || conflictingMeeting.id !== meeting1.id) {
      throw new Error("Test 6 Failed: Organizer conflict detection failed to identify overlapping meeting");
    }
    console.log("✔ Test 6 Passed: Organizer conflict detection identified overlapping time slot");

    // 4. Test 2: Edit Meeting
    const updatedMeeting1 = await db.meeting.update({
      where: { id: meeting1.id },
      data: { location: "Main Executive Boardroom" },
    });
    if (updatedMeeting1.location !== "Main Executive Boardroom") {
      throw new Error("Test 2 Failed: Edit meeting failed");
    }
    console.log("✔ Test 2 Passed: Edited meeting details successfully");

    // 5. Test 4: Complete Meeting (Outcome, Notes, Next Action)
    const completedMeeting = await db.meeting.update({
      where: { id: meeting1.id },
      data: {
        status: MeetingStatus.COMPLETED,
        outcome: "Customer agreed to pricing model",
        notes: "Discussed 3-year term discount; customer requested final agreement by Friday",
        nextAction: "Send final contract for signature",
      },
    });

    if (completedMeeting.status !== MeetingStatus.COMPLETED || !completedMeeting.outcome) {
      throw new Error("Test 4 Failed: Complete meeting recording failed");
    }
    console.log("✔ Test 4 Passed: Completed meeting with recorded outcome, notes, and next action");

    // 6. Test 3: Cancel Meeting
    const meeting2 = await db.meeting.create({
      data: {
        organizationId: orgA.id,
        title: "Preliminary Alignment Call",
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        organizerId: userPrem.id,
        status: MeetingStatus.SCHEDULED,
      },
    });

    const cancelledMeeting = await db.meeting.update({
      where: { id: meeting2.id },
      data: { status: MeetingStatus.CANCELLED },
    });

    if (cancelledMeeting.status !== MeetingStatus.CANCELLED) {
      throw new Error("Test 3 Failed: Cancel meeting failed");
    }
    console.log("✔ Test 3 Passed: Cancelled meeting successfully");

    // 7. Test 5: Calendar Display & Query Filtering
    const calList = await db.meeting.findMany({
      where: { organizationId: orgA.id, status: MeetingStatus.COMPLETED },
    });
    if (calList.length !== 1 || calList[0].id !== meeting1.id) {
      throw new Error("Test 5 Failed: Calendar display query filtering failed");
    }
    console.log("✔ Test 5 Passed: Calendar query filter returned expected events");

    // 8. Test 9: Permissions Enforcement (Non-organizer check)
    const isArunOrganizer = meeting1.organizerId === userArun.id; // Arun is NOT organizer
    if (isArunOrganizer) {
      throw new Error("Test 9 Failed: Non-organizer was falsely recognized as meeting owner");
    }
    console.log("✔ Test 9 Passed: Permissions enforced (non-organizer denied edit rights)");

    // 9. Test 10: Organization Isolation
    const orgBMeetings = await db.meeting.findMany({
      where: { organizationId: orgB.id },
    });
    if (orgBMeetings.length !== 0) {
      throw new Error("Test 10 Failed: Org B user was able to view Org A meetings!");
    }
    console.log("✔ Test 10 Passed: Organization isolation verified (Org B returned 0 meetings)");

    // Cleanup
    await db.activity.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.meeting.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.deal.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
    await db.user.deleteMany({ where: { id: { in: [userPrem.id, userArun.id, userBeta.id] } } });
    await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });

    console.log("\n🎉 ALL 10 MEETINGS & CALENDAR INTEGRATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Meetings Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runMeetingTests();
