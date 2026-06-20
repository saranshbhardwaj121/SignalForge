import type { Notification } from "@/features/notifications/types";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import { NotificationEmpty } from "@/features/notifications/components/notification-empty";

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}

export function NotificationList({ notifications, onMarkRead }: NotificationListProps) {
  if (notifications.length === 0) {
    return <NotificationEmpty />;
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
        />
      ))}
    </div>
  );
}
