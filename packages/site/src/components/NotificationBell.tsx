import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = useQuery(api.notifications.query.getUnreadCount);
  const recentNotifications = useQuery(
    api.notifications.query.getRecentNotifications,
    { limit: 5 }
  );
  const markAsRead = useMutation(api.notifications.mutation.markAsRead);
  const markAllAsRead = useMutation(api.notifications.mutation.markAllAsRead);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (
    notificationId: Id<"notifications">,
    isRead: boolean
  ) => {
    if (!isRead) {
      await markAsRead({ notificationId });
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount !== undefined && unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-medium bg-accent text-white rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background-primary dark:bg-background-dark rounded-lg shadow-lg border border-primary/10 dark:border-white/10 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 dark:border-white/10">
            <Link
              to="/notifications"
              className="font-semibold hover:text-accent"
              onClick={() => setIsOpen(false)}
            >
              Notifications
            </Link>
            {unreadCount !== undefined && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recentNotifications?.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-secondary dark:text-text-dark-secondary">
                No notifications yet
              </div>
            ) : (
              recentNotifications?.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() =>
                    handleNotificationClick(
                      notification._id,
                      notification.isRead
                    )
                  }
                  className={`w-full text-left px-4 py-3 hover:bg-primary/5 dark:hover:bg-white/5 transition-colors border-b border-primary/5 dark:border-white/5 last:border-b-0 ${
                    !notification.isRead ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notification.triggeredByUser?.avatarUrl ? (
                      <img
                        src={notification.triggeredByUser.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-accent" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-text-dark-secondary line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            className="block px-4 py-3 text-center text-sm text-accent hover:bg-primary/5 dark:hover:bg-white/5 border-t border-primary/10 dark:border-white/10"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
