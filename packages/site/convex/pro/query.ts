import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { SEAT_CONFIG } from "../../src/utils/constants";

export const getMyMembership = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return ctx.db
      .query("proMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const isPro = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const membership = await ctx.db
      .query("proMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !!membership;
  },
});

export const getMembershipByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("proMemberships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get seat inventory for all tiers
export const getSeatInventory = query({
  handler: async (ctx) => {
    const tiers = ["individual", "enterprise"] as const;
    const result: Record<
      string,
      { total: number; remaining: number; sold: number }
    > = {};

    for (const tier of tiers) {
      const inventory = await ctx.db
        .query("seatInventory")
        .withIndex("by_tier", (q) => q.eq("tier", tier))
        .first();

      if (inventory) {
        result[tier] = {
          total: inventory.totalSeats,
          remaining: inventory.remainingSeats,
          sold: inventory.totalSeats - inventory.remainingSeats,
        };
      } else {
        // Fallback to config if not initialized
        const config = SEAT_CONFIG[tier];
        result[tier] = {
          total: config.total,
          remaining: config.total,
          sold: 0,
        };
      }
    }

    return result;
  },
});
