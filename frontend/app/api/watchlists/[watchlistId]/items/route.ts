import { NextRequest } from "next/server";
import { forwardAuthenticatedRequest } from "@/lib/auth/authenticated-request";

export async function POST(
  request: NextRequest,
  { params }: { params: { watchlistId: string } }
) {
  const body = await request.json();
  return forwardAuthenticatedRequest(request, `/watchlists/${params.watchlistId}/items`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
