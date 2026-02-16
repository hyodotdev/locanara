import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { SEAT_CONFIG } from "../../src/utils/constants";

// Internal mutation to create pro membership (called after Lemon Squeezy payment)
export const createMembership = internalMutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("individual"), v.literal("enterprise")),
    lemonSqueezyOrderId: v.optional(v.string()),
    lemonSqueezyCustomerId: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already has a membership
    const existing = await ctx.db
      .query("proMemberships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Already a Pro member - upgrade tier if enterprise
      if (args.tier === "enterprise" && existing.tier !== "enterprise") {
        await ctx.db.patch(existing._id, {
          tier: "enterprise",
          lemonSqueezyOrderId: args.lemonSqueezyOrderId,
          lemonSqueezyCustomerId: args.lemonSqueezyCustomerId,
        });
      }
      return existing._id;
    }

    // Create new membership
    const membershipId = await ctx.db.insert("proMemberships", {
      userId: args.userId,
      tier: args.tier,
      githubInviteSent: false,
      githubUsername: args.githubUsername,
      lemonSqueezyOrderId: args.lemonSqueezyOrderId,
      lemonSqueezyCustomerId: args.lemonSqueezyCustomerId,
      purchasedAt: now,
      createdAt: now,
    });

    // Create welcome notification
    await ctx.runMutation(internal.notifications.mutation.createNotification, {
      userId: args.userId,
      type: "PRO_ACTIVATED",
      title: "Welcome to Locanara!",
      message:
        "Your account is now active. Visit https://github.com/hyodotdev/locanara to get started with the open-source SDK.",
    });

    return membershipId;
  },
});

// Mark GitHub invite as sent
export const markGithubInviteSent = internalMutation({
  args: {
    membershipId: v.id("proMemberships"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.membershipId, {
      githubInviteSent: true,
    });
  },
});

// Update GitHub username for membership
export const updateGithubUsername = internalMutation({
  args: {
    membershipId: v.id("proMemberships"),
    githubUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.membershipId, {
      githubUsername: args.githubUsername,
    });
  },
});

// Handle refund - mark membership as refunded
export const markRefunded = internalMutation({
  args: {
    lemonSqueezyOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("proMemberships")
      .withIndex("by_lemon_order", (q) =>
        q.eq("lemonSqueezyOrderId", args.lemonSqueezyOrderId)
      )
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, {
        refundedAt: Date.now(),
      });
      return membership._id;
    }
    return null;
  },
});

// Find membership by Lemon Squeezy order ID
export const findByOrderId = internalMutation({
  args: {
    lemonSqueezyOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proMemberships")
      .withIndex("by_lemon_order", (q) =>
        q.eq("lemonSqueezyOrderId", args.lemonSqueezyOrderId)
      )
      .first();
  },
});

// Decrement seat count when a purchase is made
export const decrementSeat = internalMutation({
  args: {
    tier: v.union(v.literal("individual"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("seatInventory")
      .withIndex("by_tier", (q) => q.eq("tier", args.tier))
      .first();

    if (inventory) {
      if (inventory.remainingSeats > 0) {
        await ctx.db.patch(inventory._id, {
          remainingSeats: inventory.remainingSeats - 1,
          updatedAt: Date.now(),
        });
        return true;
      }
      return false; // No seats left
    }

    // Initialize if not exists
    const config = SEAT_CONFIG[args.tier];
    await ctx.db.insert("seatInventory", {
      tier: args.tier,
      totalSeats: config.total,
      remainingSeats: config.total - 1, // Decrement by 1 for this purchase
      updatedAt: Date.now(),
    });
    return true;
  },
});

// Increment seat count when a refund is processed
export const incrementSeat = internalMutation({
  args: {
    tier: v.union(v.literal("individual"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("seatInventory")
      .withIndex("by_tier", (q) => q.eq("tier", args.tier))
      .first();

    if (inventory) {
      const config = SEAT_CONFIG[args.tier];
      const newRemaining = Math.min(
        inventory.remainingSeats + 1,
        config.total
      );
      await ctx.db.patch(inventory._id, {
        remainingSeats: newRemaining,
        updatedAt: Date.now(),
      });
    }
  },
});

// Initialize seat inventory (run once to seed data)
export const initializeSeatInventory = mutation({
  handler: async (ctx) => {
    const tiers = ["individual", "enterprise"] as const;

    for (const tier of tiers) {
      const existing = await ctx.db
        .query("seatInventory")
        .withIndex("by_tier", (q) => q.eq("tier", tier))
        .first();

      if (!existing) {
        const config = SEAT_CONFIG[tier];
        await ctx.db.insert("seatInventory", {
          tier,
          totalSeats: config.total,
          remainingSeats: config.total,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});
