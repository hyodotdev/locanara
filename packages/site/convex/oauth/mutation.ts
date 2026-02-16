import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// OAuth login - upsert user and link accounts by email
export const loginWithOAuth = internalMutation({
  args: {
    provider: v.union(v.literal("github"), v.literal("tesla")),
    providerUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    metadata: v.optional(
      v.union(
        v.object({ type: v.literal("github") }),
        v.object({
          type: v.literal("tesla"),
          vehicleIds: v.optional(v.array(v.string())),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Check if this provider account already exists
    const existingOAuth = await ctx.db
      .query("oauthAccounts")
      .withIndex("by_provider_user", (q) =>
        q
          .eq("provider", args.provider)
          .eq("providerUserId", args.providerUserId)
      )
      .first();

    if (existingOAuth) {
      // Update existing OAuth account (only include defined values to avoid overwriting)
      await ctx.db.patch(existingOAuth._id, {
        lastLoginAt: now,
        updatedAt: now,
        ...(args.accessToken !== undefined && {
          accessToken: args.accessToken,
        }),
        ...(args.refreshToken !== undefined && {
          refreshToken: args.refreshToken,
        }),
        ...(args.tokenExpiresAt !== undefined && {
          tokenExpiresAt: args.tokenExpiresAt,
        }),
        ...(args.metadata !== undefined && { metadata: args.metadata }),
      });
      return { userId: existingOAuth.userId, isNewUser: false };
    }

    // 2. Check if there's an existing account with the same email (for linking)
    const existingByEmail = await ctx.db
      .query("oauthAccounts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    let userId: Id<"users">;

    if (existingByEmail) {
      // Link to existing user
      userId = existingByEmail.userId;
    } else {
      // 3. Create new user
      userId = await ctx.db.insert("users", {
        email: args.email,
        name: args.displayName,
        image: args.avatarUrl,
      });

      // Create user profile
      await ctx.db.insert("userProfiles", {
        userId,
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 4. Create OAuth account entry
    await ctx.db.insert("oauthAccounts", {
      userId,
      provider: args.provider,
      providerUserId: args.providerUserId,
      email: args.email,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      metadata: args.metadata,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { userId, isNewUser: !existingByEmail };
  },
});

// Sync OAuth account from auth callback (for existing users via @convex-dev/auth)
export const syncOAuthAccount = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.union(v.literal("github"), v.literal("tesla")),
    providerUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if OAuth account already exists for this user and provider
    const existing = await ctx.db
      .query("oauthAccounts")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    if (existing) {
      // Update last login
      await ctx.db.patch(existing._id, {
        lastLoginAt: now,
        updatedAt: now,
      });
    } else {
      // Create new OAuth account entry
      await ctx.db.insert("oauthAccounts", {
        userId: args.userId,
        provider: args.provider,
        providerUserId: args.providerUserId,
        email: args.email,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update OAuth tokens (for token refresh)
export const updateTokens = internalMutation({
  args: {
    provider: v.union(v.literal("github"), v.literal("tesla")),
    providerUserId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const oauth = await ctx.db
      .query("oauthAccounts")
      .withIndex("by_provider_user", (q) =>
        q
          .eq("provider", args.provider)
          .eq("providerUserId", args.providerUserId)
      )
      .first();

    if (!oauth) {
      throw new Error("OAuth account not found");
    }

    await ctx.db.patch(oauth._id, {
      accessToken: args.accessToken,
      ...(args.refreshToken !== undefined && {
        refreshToken: args.refreshToken,
      }),
      ...(args.tokenExpiresAt !== undefined && {
        tokenExpiresAt: args.tokenExpiresAt,
      }),
      updatedAt: Date.now(),
    });
  },
});
