import { clientFetch } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { Notification, UnreadCount } from "@/features/notifications/types";

export async function listNotifications(
  limit = 50,
  offset = 0,
  unreadOnly = false
): Promise<Notification[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    unread_only: String(unreadOnly),
  });
  return clientFetch<Notification[]>(`${API_ROUTES.NOTIFICATIONS.LIST}?${params}`);
}

export async function getUnreadCount(): Promise<UnreadCount> {
  return clientFetch<UnreadCount>(API_ROUTES.NOTIFICATIONS.COUNT);
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  return clientFetch<Notification>(API_ROUTES.NOTIFICATIONS.MARK_READ(notificationId), {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<UnreadCount> {
  return clientFetch<UnreadCount>(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ, {
    method: "PATCH",
  });
}
