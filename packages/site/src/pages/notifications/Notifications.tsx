import { SEO } from "../../components/SEO";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "../../components/uis/Card";
import { Button } from "../../components/uis/Button";
import { Bell, Check, Trash2, Github } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Id } from "../../../convex/_generated/dataModel";

export function Notifications() {
  const { signIn } = useAuthActions();
  const user = useQuery(api.users.query.getCurrentUser);
  const notifications = useQuery(api.notifications.query.getUserNotifications, {
    paginationOpts: { numItems: 20, cursor: null },
  });
  const unreadCount = useQuery(api.notifications.query.getUnreadCount);

  const markAsRead = useMutation(api.notifications.mutation.markAsRead);
  const markAllAsRead = useMutation(api.notifications.mutation.markAllAsRead);
  const deleteNotification = useMutation(
    api.notifications.mutation.deleteNotification
  );

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    await markAsRead({ notificationId });
  };

  const handleDelete = async (notificationId: Id<"notifications">) => {
    await deleteNotification({ notificationId });
  };

  if (!user) {
    return (
      <>
        <SEO title="Notifications" path="/notifications" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Sign in to view notifications
            </h2>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6">
              You need to be signed in to view your notifications.
            </p>
            <Button onClick={() => signIn("github")}>
              <Github className="w-4 h-4 mr-2" />
              Sign in with GitHub
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Notifications" path="/notifications" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
              {unreadCount !== undefined && unreadCount > 0
                ? `${unreadCount} unread`
                : "All caught up!"}
            </p>
          </div>
          {unreadCount !== undefined && unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications?.page.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 text-text-secondary dark:text-text-dark-secondary mx-auto mb-4 opacity-50" />
              <h2 className="text-lg font-semibold mb-2">No notifications</h2>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                You don't have any notifications yet. When someone interacts
                with your posts or mentions you, you'll see it here.
              </p>
            </Card>
          ) : (
            notifications?.page.map((notification) => (
              <Card
                key={notification._id}
                className={`p-4 ${!notification.isRead ? "bg-accent/5 border-accent/20" : ""}`}
              >
                <div className="flex items-start gap-4">
                  {notification.triggeredByUser?.avatarUrl ? (
                    <img
                      src={notification.triggeredByUser.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-accent" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-2 rounded-lg hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-accent" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {notifications && !notifications.isDone && (
          <div className="mt-6 text-center">
            <Button variant="outline">Load more</Button>
          </div>
        )}
      </div>
    </>
  );
}
