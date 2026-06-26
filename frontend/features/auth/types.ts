export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface DeleteAccountRequest {
  password: string;
}
