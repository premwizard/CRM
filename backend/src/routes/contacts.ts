import { Router } from "express";
import { db } from "../config/db";
import { requireWritePermission, requireDeletePermission } from "../middleware/rbac";
import { resolveTenantId } from "../middleware/tenant";

const router = Router();

// GET /api/v1/contacts
router.get("/", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const search = (req.query.search as string) || "";
    const searchWhere = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const contacts = await db.contact.findMany({
      where: {
        ...searchWhere,
        organizationId: tenantId,
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: { contacts } });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch contacts" });
  }
});

// POST /api/v1/contacts
router.post("/", requireWritePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const contact = await db.contact.create({
      data: {
        ...req.body,
        organizationId: tenantId,
      },
    });
    return res.status(201).json({ success: true, data: { contact } });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, error: "Failed to create contact" });
  }
});

// PUT /api/v1/contacts/:id
router.put("/:id", requireWritePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const contactId = String(req.params.id);

    const existing = await db.contact.findFirst({
      where: { id: contactId, organizationId: tenantId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    const contact = await db.contact.update({
      where: { id: contactId },
      data: req.body,
    });
    return res.json({ success: true, data: { contact } });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, error: "Failed to update contact" });
  }
});

// DELETE /api/v1/contacts/:id
router.delete("/:id", requireWritePermission, requireDeletePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const contactId = String(req.params.id);

    const existing = await db.contact.findFirst({
      where: { id: contactId, organizationId: tenantId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    await db.contact.delete({ where: { id: contactId } });
    return res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete contact" });
  }
});

export default router;
