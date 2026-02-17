import { SEO } from "../../components/SEO";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Card } from "../../components/uis/Card";
import { Button } from "../../components/uis/Button";
import { Avatar } from "../../components/uis/Avatar";
import {
  Github,
  LogOut,
  Calendar,
  Pencil,
  X,
  Check,
  Loader2,
  Camera,
} from "lucide-react";

export function Profile() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.query.getCurrentUser);
  const updateProfile = useMutation(api.users.mutation.updateProfile);
  const generateUploadUrl = useMutation(api.users.mutation.generateUploadUrl);
  const updateAvatar = useMutation(api.users.mutation.updateAvatar);
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };

  // Get display values with fallbacks
  const avatarUrl = user?.profile?.avatarUrl || user?.image;
  const currentDisplayName =
    user?.profile?.displayName ||
    user?.profile?.githubUsername ||
    user?.name ||
    "User";
  const githubUsername = user?.profile?.githubUsername || user?.name;

  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      setDisplayName(
        user.profile?.displayName ||
          user.profile?.githubUsername ||
          user.name ||
          ""
      );
      setBio(user.profile?.bio || "");
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Update user profile with new avatar
      await updateAvatar({ storageId });

      setPreviewUrl(null);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(
      user?.profile?.displayName ||
        user?.profile?.githubUsername ||
        user?.name ||
        ""
    );
    setBio(user?.profile?.bio || "");
    setIsEditing(false);
  };

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const joinedDate = user.profile?.createdAt
    ? new Date(user.profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "Recently";

  const displayAvatarUrl = previewUrl || avatarUrl;

  return (
    <>
      <SEO title="Profile" path="/profile" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Profile</h1>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar with upload button */}
            <div className="flex-shrink-0 relative group">
              <Avatar src={displayAvatarUrl} size="lg" className="w-16 h-16" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-background-secondary dark:bg-background-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-background-secondary dark:bg-background-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">
                    {currentDisplayName}
                  </h2>
                  {githubUsername && (
                    <a
                      href={`https://github.com/${githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-text-secondary dark:text-text-dark-secondary hover:text-accent mt-1"
                    >
                      <Github className="w-4 h-4" />@{githubUsername}
                    </a>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-text-secondary dark:text-text-dark-secondary mt-2">
                    <Calendar className="w-4 h-4" />
                    Joined {joinedDate}
                  </div>
                </>
              )}
            </div>
          </div>

          {!isEditing && user.profile?.bio && (
            <p className="mt-4 text-sm text-text-secondary dark:text-text-dark-secondary">
              {user.profile.bio}
            </p>
          )}

          <p className="mt-4 text-xs text-text-secondary dark:text-text-dark-secondary">
            Hover over avatar to change profile picture
          </p>

          <div className="mt-6 pt-6 border-t border-primary/10 dark:border-white/10">
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-red-500 hover:bg-red-500/10"
            >
              {isSigningOut ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
