import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const createFeatureRequest = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create a feature request");
    }

    const now = Date.now();

    const requestId = await ctx.db.insert("featureRequests", {
      authorId: userId,
      title: args.title,
      description: args.description,
      status: "under-review",
      votesCount: 1, // Auto-upvote by creator
      createdAt: now,
      updatedAt: now,
    });

    // Auto-vote for creator
    await ctx.db.insert("featureRequestVotes", {
      featureRequestId: requestId,
      userId,
      createdAt: now,
    });

    return requestId;
  },
});

export const vote = mutation({
  args: { featureRequestId: v.id("featureRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to vote");
    }

    const request = await ctx.db.get(args.featureRequestId);
    if (!request) {
      throw new Error("Feature request not found");
    }

    // Check existing vote
    const existingVote = await ctx.db
      .query("featureRequestVotes")
      .withIndex("by_user_and_request", (q) =>
        q.eq("userId", userId).eq("featureRequestId", args.featureRequestId)
      )
      .first();

    if (existingVote) {
      // Remove vote
      await ctx.db.delete(existingVote._id);
      await ctx.db.patch(args.featureRequestId, {
        votesCount: Math.max(0, request.votesCount - 1),
        updatedAt: Date.now(),
      });
      return { voted: false };
    } else {
      // Add vote
      await ctx.db.insert("featureRequestVotes", {
        featureRequestId: args.featureRequestId,
        userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.featureRequestId, {
        votesCount: request.votesCount + 1,
        updatedAt: Date.now(),
      });
      return { voted: true };
    }
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("featureRequests"),
    status: v.union(
      v.literal("under-review"),
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile?.isAdmin) {
      throw new Error("Only admins can update status");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteFeatureRequest = mutation({
  args: { id: v.id("featureRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Feature request not found");
    }

    // Only author can delete
    if (request.authorId !== userId) {
      throw new Error("Only the author can delete this request");
    }

    // Can only delete under-review requests
    if (request.status !== "under-review") {
      throw new Error("Can only delete requests that are under review");
    }

    // Delete all votes for this request
    const votes = await ctx.db
      .query("featureRequestVotes")
      .withIndex("by_feature_request", (q) => q.eq("featureRequestId", args.id))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete the request
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
