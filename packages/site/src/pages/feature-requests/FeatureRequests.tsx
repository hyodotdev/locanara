import { SEO } from "../../components/SEO";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/uis/Button";
import {
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  Rocket,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { FeatureRequestModal } from "../community/FeatureRequestModal";
import type { Id } from "../../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type StatusFilter =
  | "all"
  | "under-review"
  | "planned"
  | "in-progress"
  | "completed";

const STATUS_CONFIG = {
  "under-review": {
    label: "Under Review",
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    icon: Search,
  },
  planned: {
    label: "Planned",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: Clock,
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    icon: Rocket,
  },
  completed: {
    label: "Completed",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    icon: CheckCircle,
  },
} as const;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Requests" },
  { key: "under-review", label: "Under Review" },
  { key: "planned", label: "Planned" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const DESCRIPTION_PREVIEW_LENGTH = 150;

interface FeatureRequestItemProps {
  request: {
    _id: Id<"featureRequests">;
    title: string;
    description?: string;
    status: "under-review" | "planned" | "in-progress" | "completed";
    votesCount: number;
    hasVoted: boolean;
    isOwner: boolean;
    author: {
      displayName: string;
      isPro: boolean;
    };
  };
  onVote: (id: Id<"featureRequests">) => void;
  onDelete: (id: Id<"featureRequests">) => void;
}

function FeatureRequestItem({
  request,
  onVote,
  onDelete,
}: FeatureRequestItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasLongDescription =
    request.description &&
    request.description.length > DESCRIPTION_PREVIEW_LENGTH;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    setIsDeleting(true);
    try {
      await onDelete(request._id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-primary/10 dark:border-white/10 hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-4">
        {/* Vote Button */}
        <button
          onClick={() => onVote(request._id)}
          className={`flex flex-col items-center justify-center w-12 h-14 rounded-md border transition-colors flex-shrink-0 ${
            request.hasVoted
              ? "bg-accent/10 border-accent/30 text-accent"
              : "bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-text-secondary dark:text-text-dark-secondary hover:border-accent/30 hover:text-accent"
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm font-semibold">{request.votesCount}</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <h3 className="font-semibold">{request.title}</h3>
            </div>
            {request.isOwner && request.status === "under-review" && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-md text-text-secondary dark:text-text-dark-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete request"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {request.description && (
            <div className="mt-1">
              {expanded || !hasLongDescription ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-text-secondary dark:text-text-dark-secondary [&_a]:text-accent [&_a]:no-underline hover:[&_a]:underline [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {request.description}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  {request.description.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...
                </p>
              )}
              {hasLongDescription && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline mt-1"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[request.status].color}`}
            >
              {STATUS_CONFIG[request.status].label}
            </span>
            <span className="text-xs text-text-secondary dark:text-text-dark-secondary">
              by {request.author.displayName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureRequests() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const requests = useQuery(api.featureRequests.query.getTopFeatureRequests, {
    limit: 100,
  });
  const topRequests = useQuery(
    api.featureRequests.query.getTopFeatureRequests,
    {
      limit: 5,
    }
  );
  const vote = useMutation(api.featureRequests.mutation.vote);
  const deleteRequest = useMutation(
    api.featureRequests.mutation.deleteFeatureRequest
  );

  const handleVote = async (id: Id<"featureRequests">) => {
    await vote({ featureRequestId: id });
  };

  const handleDelete = async (id: Id<"featureRequests">) => {
    await deleteRequest({ id });
  };

  const filteredRequests = requests?.filter(
    (r) => statusFilter === "all" || r.status === statusFilter
  );

  const getStatusCounts = () => {
    if (!requests) return {};
    const counts: Record<string, number> = { all: requests.length };
    for (const r of requests) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <>
      <SEO
        title="Feature Requests"
        description="Vote for features you want to see in Locanara SDK"
        path="/feature-requests"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              {/* New Request Button */}
              <Button
                className="w-full mb-6"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>

              {/* Status Filters */}
              <nav className="space-y-1">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      statusFilter === filter.key
                        ? "bg-accent/10 text-accent font-medium"
                        : "hover:bg-primary/5 dark:hover:bg-white/5 text-text-secondary dark:text-text-dark-secondary"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {filter.key !== "all" && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            filter.key === "under-review"
                              ? "bg-gray-500"
                              : filter.key === "planned"
                                ? "bg-blue-500"
                                : filter.key === "in-progress"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                          }`}
                        />
                      )}
                      <span>{filter.label}</span>
                    </span>
                    <span className="text-xs">
                      {statusCounts[filter.key] ?? 0}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Info */}
              <div className="mt-8 p-4 rounded-lg border border-primary/10 dark:border-white/10">
                <h3 className="font-medium text-sm mb-3">How it works</h3>
                <ul className="space-y-2 text-xs text-text-secondary dark:text-text-dark-secondary">
                  <li className="flex items-start gap-2">
                    <ChevronUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Vote for features you want</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 min-h-[600px]">
            {/* Mobile Header */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-accent" />
                  Feature Requests
                </h1>
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>

              {/* Mobile Status Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      statusFilter === filter.key
                        ? "bg-accent text-white"
                        : "bg-primary/5 dark:bg-white/5 text-text-secondary dark:text-text-dark-secondary"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-accent" />
                  Feature Requests
                </h1>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
                  Vote for features you want to see in Locanara
                </p>
              </div>
            </div>

            {/* Request List */}
            <div className="space-y-3 min-h-[400px]">
              {requests === undefined ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : filteredRequests?.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-lg border border-primary/10 dark:border-white/10 min-h-[400px] flex flex-col items-center justify-center">
                  <Lightbulb className="w-12 h-12 text-accent mb-4" />
                  <h2 className="text-lg font-semibold mb-2">
                    {statusFilter === "all"
                      ? "No feature requests yet"
                      : `No ${STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label.toLowerCase()} requests`}
                  </h2>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                    Be the first to suggest a feature!
                  </p>
                  <Button onClick={() => setIsModalOpen(true)}>
                    Request a Feature
                  </Button>
                </div>
              ) : (
                filteredRequests?.map((request) => (
                  <FeatureRequestItem
                    key={request._id}
                    request={request}
                    onVote={handleVote}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </main>

          {/* Right Sidebar - Top Requests */}
          <aside className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <div className="rounded-lg border border-primary/10 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <ChevronUp className="w-4 h-4 text-accent" />
                    <h3 className="font-semibold text-sm">Top Voted</h3>
                  </div>
                </div>

                {/* Top List */}
                <div className="divide-y divide-primary/5 dark:divide-white/5">
                  {topRequests === undefined ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    </div>
                  ) : topRequests.length === 0 ? (
                    <div className="py-6 px-4 text-center">
                      <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                        No requests yet.
                      </p>
                    </div>
                  ) : (
                    topRequests.map((request, index) => (
                      <div
                        key={request._id}
                        className="p-3 hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors"
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
                                {request.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-text-secondary dark:text-text-dark-secondary flex items-center gap-1">
                                <ChevronUp className="w-3 h-3" />
                                {request.votesCount}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_CONFIG[request.status].color}`}
                              >
                                {STATUS_CONFIG[request.status].label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <FeatureRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
