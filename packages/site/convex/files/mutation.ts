import { mutation, internalMutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Generate upload URL for file
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata after upload
export const saveFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.optional(v.string()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to get file URL");

    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      url,
      userId,
      postId: undefined, // Will be linked when post is published
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      createdAt: Date.now(),
    });

    return { fileId, url };
  },
});

// Link files to a post after publishing
export const linkFilesToPost = mutation({
  args: {
    postId: v.id("posts"),
    fileUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find files by URL and link them to the post
    for (const url of args.fileUrls) {
      const file = await ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("url"), url))
        .first();

      if (file && file.userId === userId && !file.postId) {
        await ctx.db.patch(file._id, { postId: args.postId });
      }
    }
  },
});

// Delete orphaned files (internal mutation for cron)
export const deleteOrphanedFiles = internalMutation({
  handler: async (ctx) => {
    // Find files older than 24 hours that are not linked to any post
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const orphanedFiles = await ctx.db
      .query("files")
      .withIndex("by_created")
      .filter((q) =>
        q.and(
          q.lt(q.field("createdAt"), oneDayAgo),
          q.eq(q.field("postId"), undefined)
        )
      )
      .collect();

    let deletedCount = 0;
    for (const file of orphanedFiles) {
      // Delete from storage
      await ctx.storage.delete(file.storageId);
      // Delete metadata
      await ctx.db.delete(file._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});
