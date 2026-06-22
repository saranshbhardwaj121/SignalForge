import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth/session";

function resolveFastApiBase(): string {
  const url = process.env.FASTAPI_BASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FASTAPI_BASE_URL environment variable is required in production. "
        + "Set it to the backend API URL (e.g. https://api.insique.app/api/v1)."
      );
    }
    console.warn(
      "[insique] FASTAPI_BASE_URL not set. Defaulting to http://localhost:8000/api/v1. "
      + "Create frontend/.env or set the environment variable."
    );
    return "http://localhost:8000/api/v1";
  }
  return url;
}

const FASTAPI_BASE = resolveFastApiBase();

async function execRequest(
  token: string,
  path: string,
  method: string,
  body?: string
): Promise<Response> {
  return fetch(`${FASTAPI_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
  });
}

async function buildResponse(
  fastRes: Response,
  tokens: { access_token: string; refresh_token: string } | null
): Promise<NextResponse> {
  if (fastRes.status === 204) {
    const res = new NextResponse(null, { status: 204 });
    if (tokens) setAuthCookies(res, tokens.access_token, tokens.refresh_token);
    return res;
  }

  const body = await fastRes.json().catch(() => null);

  if (!fastRes.ok) {
    return NextResponse.json(
      body || { detail: `Request failed with status ${fastRes.status}` },
      { status: fastRes.status }
    );
  }

  const res = NextResponse.json(body);
  if (tokens) setAuthCookies(res, tokens.access_token, tokens.refresh_token);
  return res;
}

export async function forwardAuthenticatedRequest(
  request: NextRequest,
  apiPath: string,
  options?: { method?: string; body?: string }
): Promise<NextResponse> {
  const method = options?.method || "GET";

  let accessToken = request.cookies.get("access_token")?.value;

  if (accessToken) {
    const fastRes = await execRequest(accessToken, apiPath, method, options?.body);
    if (fastRes.status !== 401) {
      return buildResponse(fastRes, null);
    }
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const refreshRes = await fetch(`${FASTAPI_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!refreshRes.ok) {
    return NextResponse.json({ detail: "Session expired" }, { status: 401 });
  }

  const tokens: { access_token: string; refresh_token: string } = await refreshRes.json();

  const retryRes = await execRequest(tokens.access_token, apiPath, method, options?.body);
  return buildResponse(retryRes, tokens);
}
