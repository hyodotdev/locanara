import { SEO } from "../../components/SEO";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/uis/Button";
import { useAuthActions } from "@convex-dev/auth/react";
import { useSearchParams } from "react-router-dom";
import { Users, Github, Plus, Loader2 } from "lucide-react";
import { CATEGORIES, type CategoryKey } from "../../../convex/constants";
import { PostListItem } from "./PostListItem";
import { PostWriteModal } from "./PostWriteModal";
import { PopularPostsSidebar } from "./PopularPostsSidebar";
import { useState } from "react";

export function Community() {
  const { signIn } = useAuthActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") as CategoryKey | null;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const user = useQuery(api.users.query.getCurrentUser);
  const postStats = useQuery(api.posts.query.getPostStats);
  const posts = useQuery(api.posts.query.getPosts, {
    category: selectedCategory || undefined,
    paginationOpts: { numItems: 20, cursor: null },
  });

  const handleCategoryChange = (category: CategoryKey | null) => {
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const currentCategory = selectedCategory
    ? CATEGORIES.find((c) => c.key === selectedCategory)
    : null;

  return (
    <>
      <SEO
        title={
          currentCategory ? `${currentCategory.name} - Community` : "Community"
        }
        description="Join the Locanara community. Connect with developers building privacy-first AI apps."
        path="/community"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!user && user !== undefined ? (
          /* Sign in prompt */
          <div className="max-w-md mx-auto py-12">
            <div className="p-8 text-center rounded-lg border border-primary/10 dark:border-white/10">
              <Users className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Join the Community</h2>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6">
                Sign in with GitHub to participate in discussions, share your
                projects, and connect with other developers.
              </p>
              <Button onClick={() => signIn("github")}>
                <Github className="w-4 h-4 mr-2" />
                Sign in with GitHub
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Sidebar - Categories (Desktop) */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-20">
                {/* New Post Button */}
                <Button
                  className="w-full mb-6"
                  onClick={() => setIsModalOpen(true)}
                  disabled={user === undefined}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>

                {/* Categories */}
                <nav className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-accent/10 text-accent font-medium"
                        : "hover:bg-primary/5 dark:hover:bg-white/5 text-text-secondary dark:text-text-dark-secondary"
                    }`}
                  >
                    <span>All Posts</span>
                    <span className="text-xs">{postStats?.total ?? 0}</span>
                  </button>

                  <div className="pt-2 pb-1">
                    <span className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider px-3">
                      Categories
                    </span>
                  </div>

                  {CATEGORIES.map((category) => (
                    <button
                      key={category.key}
                      onClick={() =>
                        !category.wip && handleCategoryChange(category.key)
                      }
                      disabled={category.wip}
                      title={category.wip ? "Work In Progress" : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        category.wip
                          ? "opacity-50 cursor-not-allowed text-text-secondary dark:text-text-dark-secondary"
                          : selectedCategory === category.key
                            ? "bg-accent/10 text-accent font-medium"
                            : "hover:bg-primary/5 dark:hover:bg-white/5 text-text-secondary dark:text-text-dark-secondary"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                        {category.wip && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                            WIP
                          </span>
                        )}
                      </span>
                      {!category.wip && (
                        <span className="text-xs">
                          {postStats?.byCategory?.[category.key] ?? 0}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Stats */}
                <div className="mt-8 p-4 rounded-lg border border-primary/10 dark:border-white/10">
                  <h3 className="font-medium text-sm mb-3">Community Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary dark:text-text-dark-secondary">
                        Posts
                      </span>
                      <span className="font-medium">
                        {postStats?.total ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary dark:text-text-dark-secondary">
                        Showcases
                      </span>
                      <span className="font-medium">
                        {postStats?.byCategory?.showcase ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 min-h-[600px]">
              {/* Mobile Header */}
              <div className="lg:hidden mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold">Community</h1>
                  <Button
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    disabled={user === undefined}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Post
                  </Button>
                </div>

                {/* Mobile Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-accent text-white"
                        : "bg-primary/5 dark:bg-white/5 text-text-secondary dark:text-text-dark-secondary"
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.key}
                      onClick={() =>
                        !category.wip && handleCategoryChange(category.key)
                      }
                      disabled={category.wip}
                      title={category.wip ? "Work In Progress" : undefined}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        category.wip
                          ? "opacity-50 cursor-not-allowed bg-primary/5 dark:bg-white/5 text-text-secondary dark:text-text-dark-secondary"
                          : selectedCategory === category.key
                            ? "bg-accent text-white"
                            : "bg-primary/5 dark:bg-white/5 text-text-secondary dark:text-text-dark-secondary"
                      }`}
                    >
                      {category.icon} {category.name}
                      {category.wip && " (WIP)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">
                    {currentCategory ? currentCategory.name : "All Posts"}
                  </h1>
                  {currentCategory && (
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
                      {currentCategory.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Posts List */}
              <div className="min-h-[400px]">
                {user === undefined || posts === undefined ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  </div>
                ) : posts.page.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-lg border border-primary/10 dark:border-white/10 min-h-[400px] flex flex-col items-center justify-center">
                    <div className="text-4xl mb-4">
                      {currentCategory?.icon ?? "💬"}
                    </div>
                    <h2 className="text-lg font-semibold mb-2">No posts yet</h2>
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                      Be the first to start a discussion
                      {currentCategory && ` in ${currentCategory.name}`}.
                    </p>
                    <Button onClick={() => setIsModalOpen(true)}>
                      Create the first post
                    </Button>
                  </div>
                ) : (
                  <>
                    {posts.page.map((post) => (
                      <PostListItem key={post._id} post={post} />
                    ))}

                    {/* Load More */}
                    {!posts.isDone && (
                      <div className="text-center pt-4">
                        <Button variant="outline">Load more</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>

            {/* Right Sidebar - Popular Posts */}
            <PopularPostsSidebar />
          </div>
        )}
      </div>

      {/* Post Write Modal */}
      <PostWriteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultCategory={selectedCategory}
      />
    </>
  );
}
