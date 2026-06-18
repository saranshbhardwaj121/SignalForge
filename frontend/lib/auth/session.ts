import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { User } from "@/features/auth/types";

const ACCESS_TOKEN_MAX_AGE = 60 * 15;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
}

function getCookieValue(name: string): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(name)?.value;
}

export async function getValidAccessToken(): Promise<string | null> {
  let accessToken = getCookieValue("access_token");

  if (accessToken) {
    return accessToken;
  }

  const refreshToken = getCookieValue("refresh_token");
  if (!refreshToken) {
    return null;
  }

  try {
    const data = await serverFetch<{ access_token: string; refresh_token: string }>(
      API_ROUTES.AUTH.REFRESH,
      {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );
    return data.access_token;
  } catch {
    return null;
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const accessToken = getCookieValue("access_token");

  if (!accessToken) {
    const refreshToken = getCookieValue("refresh_token");
    if (!refreshToken) {
      return null;
    }

    try {
      const tokenData = await serverFetch<{ access_token: string; refresh_token: string }>(
        API_ROUTES.AUTH.REFRESH,
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      const user = await serverFetch<User>(API_ROUTES.AUTH.ME, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      return user;
    } catch {
      return null;
    }
  }

  try {
    const user = await serverFetch<User>(API_ROUTES.AUTH.ME, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return user;
  } catch (err) {
    if (err instanceof Error && "statusCode" in err && (err as { statusCode: number }).statusCode === 401) {
      const refreshToken = getCookieValue("refresh_token");
      if (!refreshToken) return null;

      try {
        const tokenData = await serverFetch<{ access_token: string; refresh_token: string }>(
          API_ROUTES.AUTH.REFRESH,
          {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
          }
        );

        const user = await serverFetch<User>(API_ROUTES.AUTH.ME, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        return user;
      } catch {
        return null;
      }
    }
    return null;
  }
}
