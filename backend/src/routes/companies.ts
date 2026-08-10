import { Router } from 'express';
import { db } from '../config/db';

const router = Router();

// GET /api/v1/companies
router.get('/', async (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { industry: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const companies = await db.company.findMany({
      where,
      include: { _count: { select: { contacts: true, deals: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: { companies } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch companies' });
  }
});

// POST /api/v1/companies
router.post('/', async (req, res) => {
  try {
    const company = await db.company.create({ data: req.body });
    return res.status(201).json({ success: true, data: { company } });
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Failed to create company' });
  }
});

// GET /api/v1/companies/:id
router.get('/:id', async (req, res) => {
  try {
    const company = await db.company.findUnique({
      where: { id: req.params.id },
      include: { contacts: true, deals: true },
    });
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    return res.json({ success: true, data: { company } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Error fetching company' });
  }
});

// PUT /api/v1/companies/:id
router.put('/:id', async (req, res) => {
  try {
    const company = await db.company.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json({ success: true, data: { company } });
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Failed to update company' });
  }
});

// DELETE /api/v1/companies/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.company.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Company deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete company' });
  }
});

export default router;
