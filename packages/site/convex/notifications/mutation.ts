import { mutation, internalMutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Internal mutation to create notification
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("COMMENT_ON_POST"),
      v.literal("LIKE_ON_POST"),
      v.literal("LIKE_ON_COMMENT"),
      v.literal("MENTIONED"),
      v.literal("PRO_ACTIVATED"),
      v.literal("WELCOME")
    ),
    title: v.string(),
    message: v.string(),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    triggeredById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Don't create self-notifications
    if (args.triggeredById && args.triggeredById === args.userId) {
      return null;
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      postId: args.postId,
      commentId: args.commentId,
      triggeredById: args.triggeredById,
      isRead: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return { success: true };
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();

    const now = Date.now();
    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          isRead: true,
          readAt: now,
        })
      )
    );

    return { success: true, count: unreadNotifications.length };
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});
