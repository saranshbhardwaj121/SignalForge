import { NextRequest } from "next/server";
import { forwardAuthenticatedRequest } from "@/lib/auth/authenticated-request";

export async function GET(
  request: NextRequest,
  { params }: { params: { watchlistId: string } }
) {
  return forwardAuthenticatedRequest(
    request,
    `/watchlists/${params.watchlistId}/signals`
  );
}
