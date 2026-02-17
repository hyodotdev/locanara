import { mutation, internalMutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Generate upload URL for avatar
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// Update avatar with storage ID
export const updateAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    // Get the URL for the uploaded file
    const avatarUrl = await ctx.storage.getUrl(args.storageId);

    if (existing) {
      // Delete old avatar file if exists
      if (existing.avatarStorageId) {
        await ctx.storage.delete(existing.avatarStorageId);
      }

      await ctx.db.patch(existing._id, {
        avatarStorageId: args.storageId,
        avatarUrl: avatarUrl || undefined,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Get auth user data for new profile
      const user = await ctx.db.get(userId);
      return ctx.db.insert("userProfiles", {
        userId,
        avatarStorageId: args.storageId,
        avatarUrl: avatarUrl || undefined,
        githubUsername: user?.name || undefined,
        displayName: user?.name || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Internal mutation called by auth callback to sync user profile
export const syncProfile = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existingProfile) {
      // Update profile with latest GitHub data if fields are empty
      await ctx.db.patch(existingProfile._id, {
        displayName: existingProfile.displayName || args.name || undefined,
        avatarUrl: existingProfile.avatarUrl || args.image || undefined,
        githubUsername:
          existingProfile.githubUsername || args.name || undefined,
        updatedAt: now,
      });
    } else {
      // Create new profile with GitHub data
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        displayName: args.name || undefined,
        avatarUrl: args.image || undefined,
        githubUsername: args.name || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    // Build update object, only include defined values
    const updates: Record<string, unknown> = { updatedAt: now };
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.theme !== undefined) updates.theme = args.theme;
    if (args.locale !== undefined) updates.locale = args.locale;

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      // Get auth user data for new profile
      const user = await ctx.db.get(userId);
      return ctx.db.insert("userProfiles", {
        userId,
        displayName: args.displayName || user?.name || undefined,
        bio: args.bio,
        avatarUrl: args.avatarUrl || user?.image || undefined,
        theme: args.theme,
        locale: args.locale,
        githubUsername: user?.name || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const createProfileIfNotExists = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    return ctx.db.insert("userProfiles", {
      userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});
