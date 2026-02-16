import { DatabaseReader } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Parse @mentions from content and return unique usernames
export function parseMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    if (!mentions.includes(username)) {
      mentions.push(username);
    }
  }

  return mentions;
}

// Resolve usernames to user IDs
export async function resolveUsernames(
  db: DatabaseReader,
  usernames: string[]
): Promise<Map<string, Id<"users">>> {
  const usernameToUserId = new Map<string, Id<"users">>();

  for (const username of usernames) {
    // Search by githubUsername in userProfiles
    const profile = await db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("githubUsername"), username))
      .first();

    if (profile) {
      usernameToUserId.set(username, profile.userId);
    }
  }

  return usernameToUserId;
}

// Get mentioned user IDs from content, excluding the author
export async function getMentionedUserIds(
  db: DatabaseReader,
  content: string,
  authorId: Id<"users">
): Promise<Id<"users">[]> {
  const usernames = parseMentions(content);
  if (usernames.length === 0) return [];

  const usernameToUserId = await resolveUsernames(db, usernames);
  const mentionedUserIds: Id<"users">[] = [];

  for (const userId of usernameToUserId.values()) {
    // Don't notify the author if they mention themselves
    if (userId !== authorId && !mentionedUserIds.includes(userId)) {
      mentionedUserIds.push(userId);
    }
  }

  return mentionedUserIds;
}
