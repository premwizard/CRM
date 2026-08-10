import { Router } from "express";
import { db } from "../config/db";

const router = Router();

// GET /api/v1/contacts
router.get("/", async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const contacts = await db.contact.findMany({
      where,
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
router.post("/", async (req, res) => {
  try {
    const contact = await db.contact.create({ data: req.body });
    return res.status(201).json({ success: true, data: { contact } });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, error: "Failed to create contact" });
  }
});

// PUT /api/v1/contacts/:id
router.put("/:id", async (req, res) => {
  try {
    const contact = await db.contact.update({
      where: { id: req.params.id },
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
router.delete("/:id", async (req, res) => {
  try {
    await db.contact.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete contact" });
  }
});

export default router;
