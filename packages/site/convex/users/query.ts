import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Search users for @mention autocomplete
export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const searchQuery = args.query.toLowerCase().trim();
    if (searchQuery.length < 1) return [];

    // Get all user profiles and filter by search query
    const profiles = await ctx.db.query("userProfiles").collect();

    const matchedProfiles = profiles
      .filter((profile) => {
        const displayName = (profile.displayName || "").toLowerCase();
        const githubUsername = (profile.githubUsername || "").toLowerCase();
        return (
          displayName.includes(searchQuery) ||
          githubUsername.includes(searchQuery)
        );
      })
      .slice(0, 10);

    // Get user data for matched profiles
    const results = await Promise.all(
      matchedProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          userId: profile.userId,
          username: profile.githubUsername || user?.name || "user",
          displayName:
            profile.displayName ||
            profile.githubUsername ||
            user?.name ||
            "User",
          avatarUrl: profile.avatarUrl || user?.image,
        };
      })
    );

    return results;
  },
});

// Get user by username (for mention links)
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("githubUsername"), args.username))
      .first();

    if (!profile) return null;

    const user = await ctx.db.get(profile.userId);
    return {
      userId: profile.userId,
      username: profile.githubUsername || user?.name,
      displayName: profile.displayName || profile.githubUsername || user?.name,
      avatarUrl: profile.avatarUrl || user?.image,
    };
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      ...user,
      profile,
    };
  },
});

export const getProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});
