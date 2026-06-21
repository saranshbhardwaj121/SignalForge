import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/notifications/api";

export function useNotificationsQuery(limit = 20) {
  return useQuery({
    queryKey: queryKeys.notifications.list(limit),
    queryFn: () => listNotifications(limit),
    staleTime: 10_000,
  });
}

export function useUnreadCountQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.count,
    queryFn: getUnreadCount,
    refetchInterval: 120_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
