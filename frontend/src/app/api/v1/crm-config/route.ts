import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// GET /api/v1/crm-config
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.userId) {
      return apiError("Unauthorized request", 401);
    }

    const res = await fetch("http://localhost:5000/api/v1/crm-config", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return apiError(json.error || "Failed to fetch CRM config", res.status || 400);
    }

    return apiSuccess(json.data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch CRM config",
      500
    );
  }
}

// PUT /api/v1/crm-config
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.userId) {
      return apiError("Unauthorized request", 401);
    }

    const body = await request.json();
    const res = await fetch("http://localhost:5000/api/v1/crm-config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return apiError(json.error || "Failed to update CRM config", res.status || 400);
    }

    return apiSuccess(json.data, "CRM configuration updated");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to update CRM config",
      500
    );
  }
}
