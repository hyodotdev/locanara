import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { postCategories } from "../schema";
import { getMentionedUserIds } from "../lib/mentions";

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: postCategories,
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      authorId: userId,
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags,
      likesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Send notifications to mentioned users
    const mentionedUserIds = await getMentionedUserIds(ctx.db, args.content, userId);
    if (mentionedUserIds.length > 0) {
      const authorProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      const authorName = authorProfile?.displayName || authorProfile?.githubUsername || "Someone";

      for (const mentionedUserId of mentionedUserIds) {
        await ctx.runMutation(internal.notifications.mutation.createNotification, {
          userId: mentionedUserId,
          type: "MENTIONED",
          title: "You were mentioned",
          message: `${authorName} mentioned you in a post: "${args.title}"`,
          postId,
          triggeredById: userId,
        });
      }
    }

    return postId;
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(postCategories),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId) throw new Error("Not authorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.category !== undefined) updates.category = args.category;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(args.postId, updates);
    return { success: true };
  },
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId) throw new Error("Not authorized");

    // Delete all comments on this post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    await Promise.all(comments.map((c) => ctx.db.delete(c._id)));

    // Delete all likes on this post
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "post").eq("targetId", args.postId)
      )
      .collect();
    await Promise.all(likes.map((l) => ctx.db.delete(l._id)));

    // Delete the post
    await ctx.db.delete(args.postId);
    return { success: true };
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Check if user already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_target_user", (q) =>
        q.eq("targetType", "post").eq("targetId", args.postId).eq("userId", userId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likesCount: Math.max(0, post.likesCount - 1),
      });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("likes", {
        targetType: "post",
        targetId: args.postId,
        userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, {
        likesCount: post.likesCount + 1,
      });

      // Create notification for post author
      if (post.authorId !== userId) {
        const likerProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        await ctx.runMutation(internal.notifications.mutation.createNotification, {
          userId: post.authorId,
          type: "LIKE_ON_POST",
          title: "New Like",
          message: `${likerProfile?.displayName || likerProfile?.githubUsername || "Someone"} liked your post "${post.title}"`,
          postId: args.postId,
          triggeredById: userId,
        });
      }

      return { liked: true };
    }
  },
});
