import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getTopFeatureRequests = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const userId = await getAuthUserId(ctx);

    // Get all feature requests and sort by votes (desc)
    const requests = await ctx.db
      .query("featureRequests")
      .withIndex("by_votes")
      .order("desc")
      .take(limit);

    // Get user's votes
    const myVotedIds = new Set<string>();
    if (userId) {
      const myVotes = await ctx.db
        .query("featureRequestVotes")
        .withIndex("by_user_and_request", (q) => q.eq("userId", userId))
        .collect();
      myVotes.forEach((v) => myVotedIds.add(v.featureRequestId));
    }

    // Enrich with author info
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const authorUser = await ctx.db.get(request.authorId);
        const authorProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", request.authorId))
          .first();
        const authorMembership = await ctx.db
          .query("proMemberships")
          .withIndex("by_user", (q) => q.eq("userId", request.authorId))
          .first();

        const displayName =
          authorProfile?.displayName ||
          authorProfile?.githubUsername ||
          authorUser?.name ||
          "Anonymous";

        return {
          ...request,
          author: {
            id: request.authorId,
            displayName,
            isPro: !!authorMembership,
          },
          hasVoted: myVotedIds.has(request._id),
          isOwner: userId === request.authorId,
        };
      })
    );

    return enrichedRequests;
  },
});

export const getFeatureRequest = query({
  args: { id: v.id("featureRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) return null;

    const userId = await getAuthUserId(ctx);

    const authorUser = await ctx.db.get(request.authorId);
    const authorProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", request.authorId))
      .first();
    const authorMembership = await ctx.db
      .query("proMemberships")
      .withIndex("by_user", (q) => q.eq("userId", request.authorId))
      .first();

    let hasVoted = false;
    if (userId) {
      const vote = await ctx.db
        .query("featureRequestVotes")
        .withIndex("by_user_and_request", (q) =>
          q.eq("userId", userId).eq("featureRequestId", args.id)
        )
        .first();
      hasVoted = !!vote;
    }

    const displayName =
      authorProfile?.displayName ||
      authorProfile?.githubUsername ||
      authorUser?.name ||
      "Anonymous";

    return {
      ...request,
      author: {
        id: request.authorId,
        displayName,
        isPro: !!authorMembership,
      },
      hasVoted,
    };
  },
});
