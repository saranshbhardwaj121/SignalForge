import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUnreadCountQuery } from "@/features/notifications/hooks";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

export function NotificationBell() {
  const { data: unreadCount } = useUnreadCountQuery();
  const count = unreadCount?.count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] tabular-nums"
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end" sideOffset={8}>
        <NotificationCenter />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
