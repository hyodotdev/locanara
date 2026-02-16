import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrendingUp, Loader2, Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../../../convex/constants";

export function PopularPostsSidebar() {
  const posts = useQuery(api.posts.query.getPopularPosts, { limit: 5 });

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find((c) => c.key === category)?.icon ?? "💬";
  };

  return (
    <aside className="hidden xl:block w-72 flex-shrink-0">
      <div className="sticky top-20">
        <div className="rounded-lg border border-primary/10 dark:border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm">Popular Posts</h3>
            </div>
          </div>

          {/* Post List */}
          <div className="divide-y divide-primary/5 dark:divide-white/5">
            {posts === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : posts.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  No posts yet.
                </p>
              </div>
            ) : (
              posts.map((post, index) => (
                <Link
                  key={post._id}
                  to={`/community/post/${post._id}`}
                  className="block p-3 hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/5 dark:bg-white/5 flex items-center justify-center">
                      <span className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary">
                        {index + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1">
                        <h4 className="text-sm font-medium line-clamp-2 leading-tight">
                          {post.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-secondary dark:text-text-dark-secondary">
                        <span>{getCategoryIcon(post.category)}</span>
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3" />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="w-3 h-3" />
                          {post.commentsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
