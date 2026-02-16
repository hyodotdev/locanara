import { SEO } from "../../components/SEO";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/uis/Button";
import { Avatar } from "../../components/uis/Avatar";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Trash2,
  Loader2,
  Share2,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { getCategoryByKey, type CategoryKey } from "../../../convex/constants";
import {
  ContentRenderer,
  TextRenderer,
} from "../../components/uis/ContentRenderer";
import { PostWriteModal } from "../community/PostWriteModal";

export function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const user = useQuery(api.users.query.getCurrentUser);
  const post = useQuery(
    api.posts.query.getPost,
    postId ? { postId: postId as Id<"posts"> } : "skip"
  );
  const comments = useQuery(
    api.comments.query.getComments,
    postId ? { postId: postId as Id<"posts"> } : "skip"
  );

  const toggleLike = useMutation(api.posts.mutation.toggleLike);
  const deletePost = useMutation(api.posts.mutation.deletePost);
  const addComment = useMutation(api.comments.mutation.addComment);

  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatTimeAgo = (timestamp: number) => {
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
  };

  const handleLike = async () => {
    if (!postId || !user) return;
    await toggleLike({ postId: postId as Id<"posts"> });
  };

  const handleDelete = async () => {
    if (!postId || !confirm("Are you sure you want to delete this post?"))
      return;
    await deletePost({ postId: postId as Id<"posts"> });
    navigate("/community");
  };

  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !commentText.trim() || !user) return;

    setSubmitting(true);
    try {
      await addComment({
        postId: postId as Id<"posts">,
        content: commentText.trim(),
      });
      setCommentText("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post?.title,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // Loading state
  if (post === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Post not found
  if (post === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
            Post not found
          </p>
          <Link to="/community" className="text-accent hover:underline">
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user && post.author.id === user._id;
  const category = getCategoryByKey(post.category);

  return (
    <>
      <SEO
        title={post.title}
        description={post.content.slice(0, 160)}
        path={`/community/post/${postId}`}
        type="article"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        {/* Post Header - Reddit style */}
        <div className="flex items-center gap-2 text-sm mb-3">
          <Link
            to="/community"
            className="p-1 -ml-1 rounded hover:bg-primary/5 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <Link
            to={`/community?category=${post.category}`}
            className={`font-medium hover:underline ${category?.color || "text-text-secondary"}`}
          >
            {category?.icon} {category?.name || post.category}
          </Link>

          <span className="text-text-secondary/40 dark:text-text-dark-secondary/40">
            •
          </span>

          <div className="flex items-center gap-1.5">
            <Avatar src={post.author.avatarUrl} size="xs" />
            <span className="text-text-secondary dark:text-text-dark-secondary">
              {post.author.displayName}
            </span>
          </div>

          <span className="text-text-secondary/40 dark:text-text-dark-secondary/40">
            •
          </span>

          <span className="text-text-secondary dark:text-text-dark-secondary">
            {formatTimeAgo(post.createdAt)}
          </span>

          <div className="ml-auto relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded hover:bg-primary/5 dark:hover:bg-white/5"
            >
              <MoreHorizontal className="w-5 h-5 text-text-secondary dark:text-text-dark-secondary" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-background-primary dark:bg-background-dark rounded-lg shadow-xl py-1 min-w-[140px] z-20 border border-primary/10 dark:border-white/10">
                  <button
                    onClick={() => {
                      handleShare();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-primary/5 dark:hover:bg-white/5 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  {isAuthor && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-primary/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded bg-accent/15 text-accent font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-4">
          {post.title}
        </h1>

        {/* Content */}
        <div className="mb-4">
          <ContentRenderer
            content={post.content}
            className="prose prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-headings:mt-4 prose-headings:mb-2 prose-img:rounded-lg prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
          />
        </div>

        {/* Actions Bar - Reddit style */}
        <div className="flex items-center gap-1 text-text-secondary dark:text-text-dark-secondary text-sm py-2">
          <button
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 transition-colors ${
              post.hasLiked ? "text-red-500" : ""
            }`}
          >
            <Heart
              className={`w-5 h-5 ${post.hasLiked ? "fill-current" : ""}`}
            />
            <span className="font-medium">{post.likesCount}</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{post.commentsCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-primary/10 dark:bg-white/10 my-4" />

        {/* Comment Input */}
        {user && (
          <div className="flex gap-3 mb-6">
            <Avatar src={user.profile?.avatarUrl || user.image} size="sm" />
            <form onSubmit={handleSubmitComment} className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-primary/5 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none text-sm placeholder:text-text-secondary/50"
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Comments */}
        <div className="space-y-4">
          {comments?.length === 0 ? (
            <div className="py-8 text-center text-text-secondary dark:text-text-dark-secondary">
              <p>No comments yet</p>
            </div>
          ) : (
            comments?.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <Avatar src={comment.author.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {comment.author.displayName}
                    </span>
                    <span className="text-text-secondary/50 dark:text-text-dark-secondary/50">
                      •
                    </span>
                    <span className="text-text-secondary dark:text-text-dark-secondary">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <TextRenderer
                    content={comment.content}
                    className="mt-1 text-sm leading-relaxed"
                  />

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-primary/10 dark:border-white/10">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex gap-2">
                          <Avatar src={reply.author.avatarUrl} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">
                                {reply.author.displayName}
                              </span>
                              <span className="text-text-secondary/50 dark:text-text-dark-secondary/50">
                                •
                              </span>
                              <span className="text-text-secondary dark:text-text-dark-secondary">
                                {formatTimeAgo(reply.createdAt)}
                              </span>
                            </div>
                            <TextRenderer
                              content={reply.content}
                              className="mt-1 text-sm leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Post Modal */}
      {post && (
        <PostWriteModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          editPost={{
            postId: post._id,
            title: post.title,
            content: post.content,
            category: post.category as CategoryKey,
          }}
        />
      )}
    </>
  );
}
