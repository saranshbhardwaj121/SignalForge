import { Bell, BellOff, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/features/notifications/types";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  return (
    <button
      onClick={() => !notification.is_read && onMarkRead(notification.id)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-muted/20"
      )}
    >
      <div className="mt-0.5">
        {notification.is_read ? (
          <BellOff className="h-4 w-4 text-muted-foreground/40" />
        ) : (
          <Bell className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm",
              !notification.is_read ? "font-medium" : "text-muted-foreground"
            )}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <Circle className="h-2 w-2 shrink-0 fill-blue-500 text-blue-500" />
          )}
        </div>
        {notification.body && (
          <p className="truncate text-xs text-muted-foreground/70">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground/50">
          {timeAgo(notification.triggered_at)}
        </p>
      </div>
    </button>
  );
}
