import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getUserNotifications = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich notifications with triggered-by user info
    const enrichedPage = await Promise.all(
      notifications.page.map(async (notification) => {
        let triggeredByUser = null;
        if (notification.triggeredById) {
          const authUser = await ctx.db.get(notification.triggeredById);
          if (authUser) {
            const profile = await ctx.db
              .query("userProfiles")
              .withIndex("by_user", (q) => q.eq("userId", notification.triggeredById!))
              .first();
            triggeredByUser = {
              displayName: profile?.displayName || profile?.githubUsername || authUser.name || "User",
              avatarUrl: profile?.avatarUrl || authUser.image || undefined,
              githubUsername: profile?.githubUsername || authUser.name,
            };
          }
        }

        return {
          ...notification,
          triggeredByUser,
        };
      })
    );

    return {
      ...notifications,
      page: enrichedPage,
    };
  },
});

export const getUnreadCount = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();

    return unreadNotifications.length;
  },
});

export const getRecentNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit ?? 5;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // Enrich notifications with triggered-by user info
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let triggeredByUser = null;
        if (notification.triggeredById) {
          const authUser = await ctx.db.get(notification.triggeredById);
          if (authUser) {
            const profile = await ctx.db
              .query("userProfiles")
              .withIndex("by_user", (q) => q.eq("userId", notification.triggeredById!))
              .first();
            triggeredByUser = {
              displayName: profile?.displayName || profile?.githubUsername || authUser.name || "User",
              avatarUrl: profile?.avatarUrl || authUser.image || undefined,
              githubUsername: profile?.githubUsername || authUser.name,
            };
          }
        }

        return {
          ...notification,
          triggeredByUser,
        };
      })
    );

    return enrichedNotifications;
  },
});
