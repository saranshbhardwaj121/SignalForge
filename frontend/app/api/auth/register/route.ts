import { NextRequest, NextResponse } from "next/server";
import { serverFetch, ApiError } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { User } from "@/features/auth/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const user = await serverFetch<User>(API_ROUTES.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json(user, { status: 201 });
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
