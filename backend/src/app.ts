import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import companyRoutes from "./routes/companies";
import contactRoutes from "./routes/contacts";
import leadRoutes from "./routes/leads";
import activityRoutes from "./routes/activities";
import noteRoutes from "./routes/notes";
import taskRoutes from "./routes/tasks";
import dealRoutes from "./routes/deals";
import tagRoutes from "./routes/tags";
import segmentRoutes from "./routes/segments";
import searchRoutes from "./routes/search";
import bulkRoutes from "./routes/bulk";
import importExportRoutes from "./routes/importExport";
import teamRoutes from "./routes/team";
import notificationRoutes from "./routes/notifications";
import commentRoutes from "./routes/comments";
import { db } from "./config/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API v1 Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/notes", noteRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/deals", dealRoutes);
app.use("/api/v1/tags", tagRoutes);
app.use("/api/v1/segments", segmentRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/bulk", bulkRoutes);
app.use("/api/v1/team", teamRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1", importExportRoutes);

// GET /api/v1/health
app.get("/api/v1/health", (req, res) => {
  return res.json({
    success: true,
    message: "IC CRM Express Backend Server Healthy",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "IC CRM Express API",
      version: "v1",
    },
  });
});

// GET /api/v1/dashboard
app.get("/api/v1/dashboard", async (req, res) => {
  try {
    const totalContacts = await db.contact.count().catch(() => 0);
    const totalCompanies = await db.company.count().catch(() => 0);
    const totalLeads = await db.lead.count().catch(() => 0);
    const totalDeals = await db.deal.count().catch(() => 0);
    const dealAggregate = await db.deal
      .aggregate({ _sum: { value: true } })
      .catch(() => ({ _sum: { value: 0 } }));

    return res.json({
      success: true,
      data: {
        metrics: {
          totalContacts,
          totalCompanies,
          totalLeads,
          totalDeals,
          totalDealValue: dealAggregate._sum.value || 0,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Dashboard error" });
  }
});

app.listen(PORT, () => {
  console.log(
    `IC CRM Express Backend server listening on http://localhost:${PORT}`,
  );
});
