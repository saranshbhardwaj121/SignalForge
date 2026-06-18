import { NextRequest } from "next/server";
import { forwardAuthenticatedRequest } from "@/lib/auth/authenticated-request";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { watchlistId: string; ticker: string } }
) {
  return forwardAuthenticatedRequest(
    request,
    `/watchlists/${params.watchlistId}/items/${params.ticker}`,
    { method: "DELETE" }
  );
}
