import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Get all linked OAuth accounts for current user
export const getLinkedAccounts = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const accounts = await ctx.db
      .query("oauthAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Return without sensitive token data
    return accounts.map((account) => ({
      _id: account._id,
      provider: account.provider,
      email: account.email,
      lastLoginAt: account.lastLoginAt,
      createdAt: account.createdAt,
    }));
  },
});

// Check if user has a specific provider linked
export const hasProvider = query({
  args: {
    provider: v.union(v.literal("github"), v.literal("tesla")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const account = await ctx.db
      .query("oauthAccounts")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", userId).eq("provider", args.provider)
      )
      .first();

    return !!account;
  },
});
