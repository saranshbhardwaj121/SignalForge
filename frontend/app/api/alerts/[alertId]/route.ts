import { NextRequest } from "next/server";
import { forwardAuthenticatedRequest } from "@/lib/auth/authenticated-request";

export async function GET(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  return forwardAuthenticatedRequest(
    request,
    `/alerts/${params.alertId}`
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  const body = await request.json();
  return forwardAuthenticatedRequest(
    request,
    `/alerts/${params.alertId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  return forwardAuthenticatedRequest(
    request,
    `/alerts/${params.alertId}`,
    { method: "DELETE" }
  );
}
