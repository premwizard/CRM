import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyToken } from "@/lib/auth";

// POST /api/v1/emails/send
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.userId) {
      return apiError("Unauthorized request", 401);
    }

    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    if (!to || !subject || !emailBody) {
      return apiError("To, Subject, and Body are required", 400);
    }

    // Proxy to Express backend server
    const res = await fetch("http://localhost:5000/api/v1/emails/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return apiError(json.error || "Failed to send email via server", res.status || 400);
    }

    return apiSuccess(json.data, "Email sent successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to process email dispatch",
      500
    );
  }
}
