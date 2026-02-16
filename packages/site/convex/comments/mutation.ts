import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getMentionedUserIds } from "../lib/mentions";

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: userId,
      content: args.content,
      parentId: args.parentId,
      likesCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update post comment count
    await ctx.db.patch(args.postId, {
      commentsCount: post.commentsCount + 1,
    });

    // Create notification for post author
    if (post.authorId !== userId) {
      const commenterProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      await ctx.runMutation(
        internal.notifications.mutation.createNotification,
        {
          userId: post.authorId,
          type: "COMMENT_ON_POST",
          title: "New Comment",
          message: `${commenterProfile?.displayName || commenterProfile?.githubUsername || "Someone"} commented on your post "${post.title}"`,
          postId: args.postId,
          commentId,
          triggeredById: userId,
        }
      );
    }

    // If this is a reply, notify the parent comment author
    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (parentComment && parentComment.authorId !== userId) {
        const commenterProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        await ctx.runMutation(
          internal.notifications.mutation.createNotification,
          {
            userId: parentComment.authorId,
            type: "COMMENT_ON_POST",
            title: "New Reply",
            message: `${commenterProfile?.displayName || commenterProfile?.githubUsername || "Someone"} replied to your comment`,
            postId: args.postId,
            commentId,
            triggeredById: userId,
          }
        );
      }
    }

    // Send notifications to mentioned users
    const mentionedUserIds = await getMentionedUserIds(
      ctx.db,
      args.content,
      userId
    );
    // Filter out users who already received notifications (post author, parent comment author)
    const alreadyNotified = new Set([post.authorId]);
    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (parentComment) alreadyNotified.add(parentComment.authorId);
    }

    const commenterProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const commenterName =
      commenterProfile?.displayName ||
      commenterProfile?.githubUsername ||
      "Someone";

    for (const mentionedUserId of mentionedUserIds) {
      if (!alreadyNotified.has(mentionedUserId)) {
        await ctx.runMutation(
          internal.notifications.mutation.createNotification,
          {
            userId: mentionedUserId,
            type: "MENTIONED",
            title: "You were mentioned",
            message: `${commenterName} mentioned you in a comment on "${post.title}"`,
            postId: args.postId,
            commentId,
            triggeredById: userId,
          }
        );
      }
    }

    return commentId;
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== userId) throw new Error("Not authorized");

    const post = await ctx.db.get(comment.postId);

    // Delete all likes on this comment
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "comment").eq("targetId", args.commentId)
      )
      .collect();
    await Promise.all(likes.map((l) => ctx.db.delete(l._id)));

    // Delete all replies to this comment
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", comment.postId))
      .collect();
    const childReplies = replies.filter((r) => r.parentId === args.commentId);
    await Promise.all(childReplies.map((r) => ctx.db.delete(r._id)));

    // Delete the comment
    await ctx.db.delete(args.commentId);

    // Update post comment count
    if (post) {
      await ctx.db.patch(post._id, {
        commentsCount: Math.max(
          0,
          post.commentsCount - 1 - childReplies.length
        ),
      });
    }

    return { success: true };
  },
});

export const toggleCommentLike = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    // Check if user already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_target_user", (q) =>
        q
          .eq("targetType", "comment")
          .eq("targetId", args.commentId)
          .eq("userId", userId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, {
        likesCount: Math.max(0, (comment.likesCount || 0) - 1),
      });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("likes", {
        targetType: "comment",
        targetId: args.commentId,
        userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.commentId, {
        likesCount: (comment.likesCount || 0) + 1,
      });

      // Create notification for comment author
      if (comment.authorId !== userId) {
        const likerProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        await ctx.runMutation(
          internal.notifications.mutation.createNotification,
          {
            userId: comment.authorId,
            type: "LIKE_ON_COMMENT",
            title: "New Like",
            message: `${likerProfile?.displayName || likerProfile?.githubUsername || "Someone"} liked your comment`,
            postId: comment.postId,
            commentId: args.commentId,
            triggeredById: userId,
          }
        );
      }

      return { liked: true };
    }
  },
});
