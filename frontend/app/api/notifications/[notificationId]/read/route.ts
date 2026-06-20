import { NextRequest } from "next/server";
import { forwardAuthenticatedRequest } from "@/lib/auth/authenticated-request";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;
  return forwardAuthenticatedRequest(
    request,
    `/notifications/${notificationId}/read`,
    { method: "PATCH" }
  );
}
