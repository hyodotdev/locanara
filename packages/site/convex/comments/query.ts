import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    const userId = await getAuthUserId(ctx);

    // Enrich comments with author info
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        // Get author user from auth tables
        const authorUser = await ctx.db.get(comment.authorId);

        const authorProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", comment.authorId))
          .first();

        // Check Pro membership for author
        const authorMembership = await ctx.db
          .query("proMemberships")
          .withIndex("by_user", (q) => q.eq("userId", comment.authorId))
          .first();

        // Check if current user liked this comment
        let hasLiked = false;
        if (userId) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_target_user", (q) =>
              q
                .eq("targetType", "comment")
                .eq("targetId", comment._id)
                .eq("userId", userId)
            )
            .first();
          hasLiked = !!like;
        }

        // Fallback to auth user data if profile doesn't have the info
        const githubUsername =
          authorProfile?.githubUsername || authorUser?.name || "user";
        const displayName =
          authorProfile?.displayName ||
          authorProfile?.githubUsername ||
          authorUser?.name ||
          "Anonymous";
        const avatarUrl =
          authorProfile?.avatarUrl || authorUser?.image || undefined;

        return {
          ...comment,
          author: {
            id: comment.authorId,
            displayName,
            avatarUrl,
            githubUsername,
            isPro: !!authorMembership,
          },
          hasLiked,
        };
      })
    );

    // Organize into tree structure (parent comments and replies)
    const parentComments = enrichedComments.filter((c) => !c.parentId);
    const childComments = enrichedComments.filter((c) => c.parentId);

    const commentsWithReplies = parentComments.map((parent) => ({
      ...parent,
      replies: childComments.filter((child) => child.parentId === parent._id),
    }));

    return commentsWithReplies;
  },
});

export const getCommentCount = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    return comments.length;
  },
});
