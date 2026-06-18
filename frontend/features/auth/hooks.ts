import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { loginUser, registerUser, logoutUser } from "@/features/auth/api";
import type { LoginRequest, RegisterRequest } from "@/features/auth/types";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) => loginUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      router.push("/dashboard");
    },
  });
}

export function useRegisterMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) => registerUser(data),
    onSuccess: () => {
      router.push("/login");
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => logoutUser(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me, null);
      router.push("/login");
    },
  });
}
