import { NextRequest } from "next/server";
import { forwardAuthenticatedRequest } from "@/lib/auth/authenticated-request";

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  return forwardAuthenticatedRequest(
    request,
    `/analytics/${params.ticker}/sma${request.nextUrl.search}`
  );
}
