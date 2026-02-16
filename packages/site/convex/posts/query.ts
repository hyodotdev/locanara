import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { postCategories } from "../schema";

export const getPosts = query({
  args: {
    category: v.optional(postCategories),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let postsQuery;

    if (args.category) {
      postsQuery = ctx.db
        .query("posts")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc");
    } else {
      postsQuery = ctx.db.query("posts").withIndex("by_created").order("desc");
    }

    const posts = await postsQuery.paginate(args.paginationOpts);

    // Get current user ID once
    const userId = await getAuthUserId(ctx);

    // Enrich posts with author info
    const enrichedPage = await Promise.all(
      posts.page.map(async (post) => {
        // Get author user from auth tables
        const authorUser = await ctx.db.get(post.authorId);

        const authorProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", post.authorId))
          .first();

        // Check Pro membership for author
        const authorMembership = await ctx.db
          .query("proMemberships")
          .withIndex("by_user", (q) => q.eq("userId", post.authorId))
          .first();

        // Check if current user liked this post
        let hasLiked = false;
        if (userId) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_target_user", (q) =>
              q.eq("targetType", "post").eq("targetId", post._id).eq("userId", userId)
            )
            .first();
          hasLiked = !!like;
        }

        // Fallback to auth user data if profile doesn't have the info
        const githubUsername =
          authorProfile?.githubUsername || authorUser?.name || "user";
        const displayName =
          authorProfile?.displayName || authorProfile?.githubUsername || authorUser?.name || "Anonymous";
        const avatarUrl =
          authorProfile?.avatarUrl || authorUser?.image || undefined;

        return {
          ...post,
          author: {
            id: post.authorId,
            displayName,
            avatarUrl,
            githubUsername,
            isPro: !!authorMembership,
          },
          hasLiked,
        };
      })
    );

    return {
      ...posts,
      page: enrichedPage,
    };
  },
});

export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    // Get author user from auth tables
    const authorUser = await ctx.db.get(post.authorId);

    const authorProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", post.authorId))
      .first();

    // Check Pro membership for author
    const authorMembership = await ctx.db
      .query("proMemberships")
      .withIndex("by_user", (q) => q.eq("userId", post.authorId))
      .first();

    // Check if current user liked this post
    const userId = await getAuthUserId(ctx);
    let hasLiked = false;
    if (userId) {
      const like = await ctx.db
        .query("likes")
        .withIndex("by_target_user", (q) =>
          q.eq("targetType", "post").eq("targetId", post._id).eq("userId", userId)
        )
        .first();
      hasLiked = !!like;
    }

    // Fallback to auth user data if profile doesn't have the info
    const githubUsername =
      authorProfile?.githubUsername || authorUser?.name || "user";
    const displayName =
      authorProfile?.displayName || authorProfile?.githubUsername || authorUser?.name || "Anonymous";
    const avatarUrl =
      authorProfile?.avatarUrl || authorUser?.image || undefined;

    return {
      ...post,
      author: {
        id: post.authorId,
        displayName,
        avatarUrl,
        githubUsername,
        isPro: !!authorMembership,
      },
      hasLiked,
    };
  },
});

export const getMyPosts = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    return posts;
  },
});

export const getPostStats = query({
  handler: async (ctx) => {
    const allPosts = await ctx.db.query("posts").collect();

    const categoryStats: Record<string, number> = {};
    for (const post of allPosts) {
      categoryStats[post.category] = (categoryStats[post.category] || 0) + 1;
    }

    return {
      total: allPosts.length,
      byCategory: categoryStats,
    };
  },
});

export const getPopularPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    // Get all posts and sort by likesCount (no index for this, so collect and sort)
    const allPosts = await ctx.db.query("posts").collect();
    const sortedPosts = allPosts
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, limit);

    // Enrich with author info
    const enrichedPosts = await Promise.all(
      sortedPosts.map(async (post) => {
        const authorUser = await ctx.db.get(post.authorId);
        const authorProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", post.authorId))
          .first();
        const authorMembership = await ctx.db
          .query("proMemberships")
          .withIndex("by_user", (q) => q.eq("userId", post.authorId))
          .first();

        const displayName =
          authorProfile?.displayName ||
          authorProfile?.githubUsername ||
          authorUser?.name ||
          "Anonymous";

        return {
          _id: post._id,
          title: post.title,
          category: post.category,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          author: {
            displayName,
            isPro: !!authorMembership,
          },
        };
      })
    );

    return enrichedPosts;
  },
});
