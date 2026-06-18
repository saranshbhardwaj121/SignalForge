import { NextRequest, NextResponse } from "next/server";
import { serverFetch, ApiError } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { setAuthCookies } from "@/lib/auth/session";
import type { AuthTokens } from "@/features/auth/types";

export async function POST(request: NextRequest) {
  try {
    const refreshToken =
      request.cookies.get("refresh_token")?.value ?? (await request.json()).refresh_token;

    if (!refreshToken) {
      return NextResponse.json({ detail: "Refresh token required" }, { status: 401 });
    }

    const tokens = await serverFetch<AuthTokens>(API_ROUTES.AUTH.REFRESH, {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const response = NextResponse.json(tokens);
    setAuthCookies(response, tokens.access_token, tokens.refresh_token);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
