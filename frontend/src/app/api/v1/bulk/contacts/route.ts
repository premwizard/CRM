import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";

// POST /api/v1/bulk/contacts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids, data } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError("No contact IDs provided", 400);
    }

    if (!action) {
      return apiError("Action is required", 400);
    }

    // 1. Export Action
    if (action === "export") {
      const contacts = await db.contact.findMany({
        where: { id: { in: ids } },
        include: {
          company: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
      });
      return apiSuccess({ action: "export", total: contacts.length, contacts });
    }

    // 2. Assign Owner
    if (action === "assign-owner") {
      const { owner } = data || {};
      const ownerValue = owner !== undefined ? owner : null;

      const result = await db.contact.updateMany({
        where: { id: { in: ids } },
        data: { owner: ownerValue },
      });

      return apiSuccess(
        { action: "assign-owner", successCount: result.count, failureCount: 0 },
        "Bulk owner assigned successfully",
      );
    }

    // 3. Add Tag
    if (action === "add-tag") {
      const { tagId, tagName, color } = data || {};
      let targetTagId = tagId;

      if (!targetTagId && tagName) {
        const nameClean = tagName.trim();
        let existingTag = await db.tag.findUnique({ where: { name: nameClean } });
        if (!existingTag) {
          existingTag = await db.tag.create({
            data: { name: nameClean, color: color || "#3B82F6" },
          });
        }
        targetTagId = existingTag.id;
      }

      if (!targetTagId) {
        return apiError("Tag ID or Tag Name is required", 400);
      }

      let successCount = 0;
      let failureCount = 0;
      const errors: { id: string; error: string }[] = [];

      await db.$transaction(async (tx) => {
        for (const contactId of ids) {
          try {
            await tx.contactTag.upsert({
              where: { contactId_tagId: { contactId, tagId: targetTagId } },
              create: { contactId, tagId: targetTagId },
              update: {},
            });
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push({
              id: contactId,
              error: err instanceof Error ? err.message : "Failed to add tag",
            });
          }
        }
      });

      return apiSuccess(
        { action: "add-tag", successCount, failureCount, errors },
        "Bulk tag operation completed",
      );
    }

    // 4. Remove Tag
    if (action === "remove-tag") {
      const { tagId } = data || {};
      if (!tagId) {
        return apiError("Tag ID is required", 400);
      }

      const result = await db.contactTag.deleteMany({
        where: {
          contactId: { in: ids },
          tagId: tagId,
        },
      });

      return apiSuccess(
        { action: "remove-tag", successCount: result.count, failureCount: 0 },
        "Bulk tag removed successfully",
      );
    }

    // 5. Delete Contacts
    if (action === "delete") {
      const result = await db.contact.deleteMany({
        where: { id: { in: ids } },
      });

      return apiSuccess(
        { action: "delete", successCount: result.count, failureCount: 0 },
        "Bulk contact deletion completed",
      );
    }

    return apiError(`Invalid action '${action}' for Contacts`, 400);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Bulk contact action failed",
      500,
    );
  }
}
