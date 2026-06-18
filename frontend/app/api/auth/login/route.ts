import { NextRequest, NextResponse } from "next/server";
import { serverFetch, ApiError } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/session";
import type { User, AuthTokens } from "@/features/auth/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tokens = await serverFetch<AuthTokens>(API_ROUTES.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify(body),
    });

    const user = await serverFetch<User>(API_ROUTES.AUTH.ME, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const response = NextResponse.json(user);
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
