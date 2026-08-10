import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export function apiSuccess<T>(data: T, message?: string, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

export function apiError(error: string, status = 400) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error,
    },
    { status },
  );
}
