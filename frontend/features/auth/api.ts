import { clientFetch, ApiError } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { User, LoginRequest, RegisterRequest } from "@/features/auth/types";

export async function loginUser(data: LoginRequest): Promise<User> {
  const result = await clientFetch<User>(API_ROUTES.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result;
}

export async function registerUser(data: RegisterRequest): Promise<User> {
  const result = await clientFetch<User>(API_ROUTES.AUTH.REGISTER, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result;
}

export async function fetchCurrentUser(): Promise<User> {
  return clientFetch<User>(API_ROUTES.AUTH.ME);
}

export async function logoutUser(): Promise<void> {
  await clientFetch<void>(API_ROUTES.AUTH.LOGOUT, {
    method: "POST",
    body: JSON.stringify({ refresh_token: "" }),
  });
}

export { ApiError };
