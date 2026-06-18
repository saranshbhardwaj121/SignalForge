"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "@/lib/api/query-keys";
import {
  fetchCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "@/features/auth/api";
import type { User, LoginRequest, RegisterRequest } from "@/features/auth/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      router.push("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      router.push("/login");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me, null);
      router.push("/login");
    },
  });

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: isError ? null : (user ?? null),
      isAuthenticated: !isError && !!user,
      isLoading,
      login: async (data: LoginRequest) => {
        await loginMutation.mutateAsync(data);
      },
      register: async (data: RegisterRequest) => {
        return registerMutation.mutateAsync(data);
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [user, isError, isLoading, loginMutation, registerMutation, logoutMutation]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
