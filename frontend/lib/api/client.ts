import { parseErrorResponse, ApiError } from "@/lib/api/errors";

function resolveApiBaseUrl(): string {
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

const FASTAPI_BASE_URL = resolveApiBaseUrl();

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

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

export { ApiError };
