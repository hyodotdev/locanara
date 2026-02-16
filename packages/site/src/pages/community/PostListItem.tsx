import { Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { getCategoryByKey } from "../../../convex/constants";
import { Avatar } from "../../components/uis/Avatar";

interface PostAuthor {
  id: Id<"users">;
  displayName: string;
  githubUsername: string;
  avatarUrl?: string;
  isPro: boolean;
}

interface Post {
  _id: Id<"posts">;
  title: string;
  content: string;
  category: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  viewCount?: number;
  createdAt: number;
  author: PostAuthor;
  hasLiked?: boolean;
}

interface PostListItemProps {
  post: Post;
}

// Extract first image URL from markdown content
function extractThumbnail(content: string): string | null {
  // Match markdown image syntax: ![alt](url)
  const markdownMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (markdownMatch) return markdownMatch[1];

  // Match HTML img tag
  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch) return htmlMatch[1];

  return null;
}

// Strip markdown/html and truncate content for preview
function getPreview(content: string, maxLength = 200): string {
  const stripped = content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // Remove markdown images
    .replace(/<img[^>]*>/gi, "") // Remove HTML images
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "") // Remove iframes
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1") // Keep link text, remove URL
    .replace(/[#*`~_]/g, "") // Remove markdown syntax
    .replace(/\n{3,}/g, "\n\n") // Clean up extra whitespace
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();
  return stripped.length > maxLength
    ? stripped.slice(0, maxLength) + "..."
    : stripped;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function PostListItem({ post }: PostListItemProps) {
  const category = getCategoryByKey(post.category);
  const thumbnail = extractThumbnail(post.content);
  const contentPreview = getPreview(post.content);
  const toggleLike = useMutation(api.posts.mutation.toggleLike);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleLike({ postId: post._id });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        url: `${window.location.origin}/community/post/${post._id}`,
      });
    } else {
      await navigator.clipboard.writeText(
        `${window.location.origin}/community/post/${post._id}`
      );
    }
  };

  return (
    <Link to={`/community/post/${post._id}`} className="block group">
      <article className="py-4 hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors">
        {/* Header: Category • Author • Time */}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-text-dark-secondary mb-2">
          {category && (
            <>
              <span className={`font-medium ${category.color}`}>
                {category.icon} {category.name}
              </span>
              <span className="opacity-50">•</span>
            </>
          )}
          <Avatar src={post.author.avatarUrl} size="xs" className="w-4 h-4" />
          <span>{post.author.displayName}</span>
          <span className="opacity-50">•</span>
          <span>{formatTimeAgo(post.createdAt)}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary group-hover:text-accent transition-colors mb-1">
          {post.title}
        </h3>

        {/* Content preview */}
        {contentPreview && (
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary line-clamp-2 mb-2">
            {contentPreview}
          </p>
        )}

        {/* Thumbnail */}
        {thumbnail && (
          <div className="mt-2 mb-3 rounded-xl overflow-hidden bg-primary/5 dark:bg-white/5 max-w-md">
            <img
              src={thumbnail}
              alt={post.title}
              className="w-full h-auto max-h-80 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Actions - Reddit style badges */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 transition-colors ${
              post.hasLiked
                ? "text-red-500"
                : "text-text-secondary dark:text-text-dark-secondary"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${post.hasLiked ? "fill-current" : ""}`}
            />
            <span>{post.likesCount}</span>
          </button>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 dark:bg-white/5 text-text-secondary dark:text-text-dark-secondary">
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount}</span>
          </span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 text-text-secondary dark:text-text-dark-secondary transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </article>

      {/* Separator */}
      <div className="h-px bg-primary/10 dark:bg-white/10 mt-2" />
    </Link>
  );
}
