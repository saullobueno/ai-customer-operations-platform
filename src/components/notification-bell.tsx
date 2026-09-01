import { Bell } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/server/actions/notifications";

type NotificationItem = {
  id: string;
  message: string;
  read: boolean;
  ticketId: string | null;
  createdAt: Date;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificações
          {unreadCount > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="text-xs font-normal text-muted-foreground hover:underline"
              >
                marcar todas como lidas
              </button>
            </form>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação por aqui.
          </p>
        )}
        {notifications.map((item) => (
          <DropdownMenuItem key={item.id} asChild>
            <Link
              href={item.ticketId ? `/tickets/${item.ticketId}` : "/inbox"}
              className={item.read ? "opacity-60" : ""}
            >
              {item.message}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
