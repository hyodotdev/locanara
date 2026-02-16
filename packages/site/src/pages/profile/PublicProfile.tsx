import { SEO } from "../../components/SEO";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, Link } from "react-router-dom";
import { Card } from "../../components/uis/Card";
import { Avatar } from "../../components/uis/Avatar";
import { Github, ArrowLeft, Loader2, UserX } from "lucide-react";

export function PublicProfile() {
  const { username } = useParams<{ username: string }>();

  const userProfile = useQuery(
    api.users.query.getUserByUsername,
    username ? { username } : "skip"
  );

  // Loading state
  if (userProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  // User not found
  if (userProfile === null) {
    return (
      <>
        <SEO title="User Not Found" path={`/profile/${username}`} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <Link
            to="/community"
            className="inline-flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary hover:text-accent mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>

          <Card className="p-8 text-center">
            <UserX className="w-12 h-12 mx-auto mb-4 text-text-secondary dark:text-text-dark-secondary opacity-50" />
            <h1 className="text-xl font-semibold mb-2">User Not Found</h1>
            <p className="text-text-secondary dark:text-text-dark-secondary">
              The user @{username} doesn't exist or has been removed.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${userProfile.displayName} (@${userProfile.username})`}
        path={`/profile/${username}`}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary hover:text-accent mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community
        </Link>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar
              src={userProfile.avatarUrl}
              size="lg"
              className="w-16 h-16"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">
                  {userProfile.displayName}
                </h1>
                {/* Note: isPro would need to be added to the query if we want to show Pro badge */}
              </div>

              {userProfile.username && (
                <a
                  href={`https://github.com/${userProfile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-text-secondary dark:text-text-dark-secondary hover:text-accent mt-1"
                >
                  <Github className="w-4 h-4" />@{userProfile.username}
                </a>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
