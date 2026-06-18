import { NextRequest, NextResponse } from "next/server";
import { serverFetch, ApiError } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { clearAuthCookies } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      try {
        await serverFetch(API_ROUTES.AUTH.LOGOUT, {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore backend errors during logout
      }
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  }
}
