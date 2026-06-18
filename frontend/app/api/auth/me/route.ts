import { NextRequest, NextResponse } from "next/server";
import { serverFetch, ApiError } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { setAuthCookies } from "@/lib/auth/session";
import type { User, AuthTokens } from "@/features/auth/types";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      const refreshToken = request.cookies.get("refresh_token")?.value;
      if (!refreshToken) {
        return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
      }

      const tokens = await serverFetch<AuthTokens>(API_ROUTES.AUTH.REFRESH, {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const user = await serverFetch<User>(API_ROUTES.AUTH.ME, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const response = NextResponse.json(user);
      setAuthCookies(response, tokens.access_token, tokens.refresh_token);
      return response;
    }

    try {
      const user = await serverFetch<User>(API_ROUTES.AUTH.ME, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return NextResponse.json(user);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        const refreshToken = request.cookies.get("refresh_token")?.value;
        if (!refreshToken) {
          return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
        }

        const tokens = await serverFetch<AuthTokens>(API_ROUTES.AUTH.REFRESH, {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        const user = await serverFetch<User>(API_ROUTES.AUTH.ME, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const response = NextResponse.json(user);
        setAuthCookies(response, tokens.access_token, tokens.refresh_token);
        return response;
      }
      throw err;
    }
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
