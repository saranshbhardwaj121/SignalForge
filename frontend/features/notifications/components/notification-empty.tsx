import { Bell } from "lucide-react";

export function NotificationEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <Bell className="h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">No notifications yet</p>
      <p className="text-xs text-muted-foreground/60">
        Notifications will appear here when alerts trigger.
      </p>
    </div>
  );
}
