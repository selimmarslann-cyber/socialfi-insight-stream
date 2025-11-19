import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWalletStore } from "@/lib/store";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function NotificationBell() {
  const { address, connected } = useWalletStore();
  const queryClient = useQueryClient();

  const unreadCountQuery = useQuery({
    queryKey: ["notifications-unread", address],
    queryFn: () => getUnreadCount(address ?? ""),
    enabled: Boolean(address && connected),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", address],
    queryFn: () => getUserNotifications(address ?? "", 20),
    enabled: Boolean(address && connected),
    refetchInterval: 30 * 1000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(address ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success("All notifications marked as read");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const unreadCount = unreadCountQuery.data ?? 0;
  const notifications = notificationsQuery.data ?? [];

  if (!connected || !address) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border-subtle p-4">
          <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Mark all read"
              )}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => markReadMutation.mutate(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    created_at: string;
  };
  onMarkRead: () => void;
}) {
  const content = notification.link ? (
    <Link
      to={notification.link}
      onClick={onMarkRead}
      className="block p-4 hover:bg-surface-muted"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${notification.read ? "text-text-secondary" : "text-text-primary"}`}>
            {notification.title}
          </p>
          <p className="mt-1 text-xs text-text-muted">{notification.message}</p>
          <p className="mt-1 text-xs text-text-muted">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-indigo-500" />
        )}
      </div>
    </Link>
  ) : (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${notification.read ? "text-text-secondary" : "text-text-primary"}`}>
            {notification.title}
          </p>
          <p className="mt-1 text-xs text-text-muted">{notification.message}</p>
          <p className="mt-1 text-xs text-text-muted">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkRead}
            className="h-6 w-6 p-0"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  return content;
}

