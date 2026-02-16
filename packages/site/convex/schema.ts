import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Notification types
export const notificationTypes = v.union(
  v.literal("COMMENT_ON_POST"),
  v.literal("LIKE_ON_POST"),
  v.literal("LIKE_ON_COMMENT"),
  v.literal("MENTIONED"),
  v.literal("PRO_ACTIVATED"),
  v.literal("WELCOME")
);

// Pro membership tiers (lifetime purchase)
export const proTiers = v.union(
  v.literal("individual"),
  v.literal("enterprise")
);

// Post categories - platform-based boards
export const postCategories = v.union(
  v.literal("general"),
  v.literal("ios"),
  v.literal("android"),
  v.literal("react-native"),
  v.literal("expo"),
  v.literal("flutter"),
  v.literal("kmp"),
  v.literal("showcase"),
  v.literal("help")
);

export default defineSchema({
  ...authTables,

  // Files storage for post images
  files: defineTable({
    storageId: v.id("_storage"),
    url: v.string(),
    userId: v.id("users"),
    postId: v.optional(v.id("posts")), // null until post is published
    filename: v.optional(v.string()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_storage", ["storageId"])
    .index("by_created", ["createdAt"]),

  // Extended user profile
  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")), // Convex file storage
    githubUsername: v.optional(v.string()),
    locale: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    isAdmin: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Pro memberships (lifetime purchase)
  proMemberships: defineTable({
    userId: v.id("users"),
    tier: proTiers,
    githubInviteSent: v.boolean(),
    githubUsername: v.optional(v.string()),
    purchasedAt: v.number(),
    lemonSqueezyOrderId: v.optional(v.string()),
    lemonSqueezyCustomerId: v.optional(v.string()),
    refundedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_lemon_order", ["lemonSqueezyOrderId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: notificationTypes,
    title: v.string(),
    message: v.string(),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    triggeredById: v.optional(v.id("users")),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_type", ["type"]),

  // Community posts/discussions
  posts: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    category: postCategories,
    tags: v.array(v.string()),
    likesCount: v.number(),
    commentsCount: v.number(),
    viewCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_category", ["category"])
    .index("by_created", ["createdAt"]),

  // Comments on posts
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
    likesCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"]),

  // Unified likes table for posts and comments
  likes: defineTable({
    targetType: v.union(v.literal("post"), v.literal("comment")),
    targetId: v.string(), // post._id or comment._id as string
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_user", ["userId"])
    .index("by_target_user", ["targetType", "targetId", "userId"]),

  // Seat inventory for founding member program
  seatInventory: defineTable({
    tier: proTiers,
    totalSeats: v.number(),
    remainingSeats: v.number(),
    updatedAt: v.number(),
  }).index("by_tier", ["tier"]),

  // Feature requests (Canny-style)
  featureRequests: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("under-review"),
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed")
    ),
    votesCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_votes", ["votesCount"]),

  // Feature request votes (prevent duplicate votes)
  featureRequestVotes: defineTable({
    featureRequestId: v.id("featureRequests"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_feature_request", ["featureRequestId"])
    .index("by_user_and_request", ["userId", "featureRequestId"]),

  // OAuth accounts (multiple providers per user)
  oauthAccounts: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("github"), v.literal("tesla")),
    providerUserId: v.string(), // Provider's user ID
    email: v.string(), // Required for email-based account linking
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    metadata: v.optional(
      v.union(
        v.object({ type: v.literal("github") }),
        v.object({ type: v.literal("tesla"), vehicleIds: v.optional(v.array(v.string())) })
      )
    ),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_provider_user", ["provider", "providerUserId"])
    .index("by_user_provider", ["userId", "provider"]),
});
