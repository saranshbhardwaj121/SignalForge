import { NextRequest } from "next/server";
import { forwardAuthenticatedRequest } from "@/lib/auth/authenticated-request";

export async function GET(request: NextRequest) {
  return forwardAuthenticatedRequest(
    request,
    `/notifications${request.nextUrl.search}`
  );
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return forwardAuthenticatedRequest(request, "/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
