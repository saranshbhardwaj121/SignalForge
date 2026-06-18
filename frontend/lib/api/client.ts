import { parseErrorResponse, ApiError } from "@/lib/api/errors";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "http://localhost:8000/api/v1";

export async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${FASTAPI_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

export async function clientFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `/api${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

export { ApiError };
