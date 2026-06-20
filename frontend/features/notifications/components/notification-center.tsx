import { useNotificationsQuery, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/features/notifications/hooks";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { NotificationSkeleton } from "@/features/notifications/components/notification-skeleton";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function NotificationCenter() {
  const { data: notifications, isLoading, isError } = useNotificationsQuery(20);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div className="w-80">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Notifications</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={handleMarkAllRead}
          disabled={markAllReadMutation.isPending}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <NotificationSkeleton />
      ) : isError ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Failed to load notifications.
        </div>
      ) : (
        <NotificationList
          notifications={notifications ?? []}
          onMarkRead={handleMarkRead}
        />
      )}
    </div>
  );
}
