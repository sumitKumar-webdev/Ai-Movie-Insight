"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgePlus, Mail, MessageCircle } from "lucide-react";
import ProfileSidebar, {
  ProfileSidebarSkeleton,
} from "@/app/(page)/profile/profile-sidebar";
import { Skeleton } from "@/app/components/ui/skeleton";
import { ReviewPreviewCard } from "@/app/components/cards/review-preview-card";
import ProfileSettingsModal from "@/app/modal/profile-settings-modal";
import UserPreferencesModal from "@/app/modal/user-preferences-modal";
import { Review } from "@/app/models/service.modal";
import { getPublicProfileByUsername } from "@/app/services/auth.service";
import { getUserReviews } from "@/app/services/review.service";
import { AuthUser, PublicProfileUser } from "@/app/store/auth-slice";
import { useAuthStore } from "@/app/store/store";
import { getProfileHref, normalizeProfileUsername } from "@/lib/profile";
import ProfileNotFoundState from "@/app/(page)/profile/profile-not-found-state";
import ReviewPreviewCardSkeleton from "@/app/(page)/profile/review-preview-card-skeleton";

const panelClassName =
  "rounded-[1.05rem] border border-white/10 bg-[#0a0a0a] shadow-[0_18px_44px_rgba(0,0,0,0.28)]";

const preferenceGroups = [
  { key: "cinemas", label: "Industries" },
  { key: "languages", label: "Languages" },
  { key: "genres", label: "Genres" },
  { key: "moods", label: "Moods" },
  { key: "formats", label: "Formats" },
] as const;

type ReviewWithMovieMeta = Review & {
  posterUrl?: string | null;
  movieYear?: string;
  movieType?: string;
};

function getPossessiveLabel(value: string) {
  return value.endsWith("s") ? `${value}'` : `${value}'s`;
}

export default function ProfileView({
  requestedUsername,
}: {
  requestedUsername: string;
}) {
  const router = useRouter();
  const authUser = useAuthStore((auth) => auth.user);
  const rawRequestedUsername = requestedUsername.trim();
  const normalizedRequestedUsername =
    normalizeProfileUsername(rawRequestedUsername);
  const matchesAuthenticatedUser = Boolean(
    authUser?.username &&
      authUser.username.trim().toLowerCase() ===
        normalizedRequestedUsername.toLowerCase(),
  );
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<PublicProfileUser | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(
    Boolean(normalizedRequestedUsername) && !matchesAuthenticatedUser,
  );
  const [profileError, setProfileError] = useState("");
  const [userReviews, setUserReviews] = useState<ReviewWithMovieMeta[]>([]);
  const [loadedReviewsUserId, setLoadedReviewsUserId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!rawRequestedUsername || rawRequestedUsername.startsWith("@")) {
      return;
    }

    router.replace(getProfileHref(rawRequestedUsername));
  }, [rawRequestedUsername, router]);

  useEffect(() => {
    let cancelled = false;

    if (!normalizedRequestedUsername) {
      return () => {
        cancelled = true;
      };
    }

    if (matchesAuthenticatedUser) {
      return () => {
        cancelled = true;
      };
    }

    void getPublicProfileByUsername(normalizedRequestedUsername)
      .then((result) => {
        if (cancelled) return;

        if (!result.ok || !result.user) {
          setProfileUser(null);
          setProfileError(
            result.message || "This user profile could not be found.",
          );
          setProfileLoading(false);
          return;
        }

        setProfileUser(result.user);
        setProfileError("");
        setProfileLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProfileUser(null);
        setProfileError("Failed to load this profile right now.");
        setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [matchesAuthenticatedUser, normalizedRequestedUsername]);

  useEffect(() => {
    if (!authUser?.id || !profileUser?.id) return;
    if (authUser.id !== profileUser.id) return;

    const canonicalUsername = authUser.username?.trim();
    if (!canonicalUsername) return;

    if (
      canonicalUsername.toLowerCase() !==
      normalizedRequestedUsername.toLowerCase()
    ) {
      router.replace(getProfileHref(canonicalUsername));
    }
  }, [
    authUser?.id,
    authUser?.username,
    normalizedRequestedUsername,
    profileUser?.id,
    router,
  ]);

  const isOwnProfile = Boolean(
    matchesAuthenticatedUser ||
      (authUser?.id && profileUser?.id && authUser.id === profileUser.id),
  );
  const resolvedUser = (matchesAuthenticatedUser ? authUser : profileUser) as
    | AuthUser
    | PublicProfileUser
    | null;
  const activeUserId = resolvedUser?.id ?? "";

  useEffect(() => {
    let cancelled = false;

    if (!activeUserId) {
      return () => {
        cancelled = true;
      };
    }

    void getUserReviews(activeUserId, { limit: 10 })
      .then((reviews) => {
        const authoredReviews = Array.isArray(reviews) ? reviews : [];
        if (cancelled) return;

        setUserReviews(authoredReviews);
        setLoadedReviewsUserId(activeUserId);
      })
      .catch(() => {
        if (cancelled) return;
        setUserReviews([]);
        setLoadedReviewsUserId(activeUserId);
      });

    return () => {
      cancelled = true;
    };
  }, [activeUserId]);

  const providerLabel = authUser?.authProvider?.length
    ? authUser.authProvider
        .map((provider) => provider.charAt(0).toUpperCase() + provider.slice(1))
        .join(", ")
    : "Email";

  const preferenceSummary = useMemo(
    () =>
      preferenceGroups.map((group) => ({
        ...group,
        items:
          isOwnProfile && Array.isArray(authUser?.preferences?.[group.key])
            ? authUser.preferences[group.key]
            : [],
      })),
    [authUser, isOwnProfile],
  );

  const totalPreferenceCount = preferenceSummary.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  const sidebarLoading = profileLoading || !resolvedUser;
  const currentUserReviews =
    activeUserId && loadedReviewsUserId === activeUserId ? userReviews : [];
  const reviewsLoading =
    sidebarLoading ||
    (Boolean(activeUserId) && loadedReviewsUserId !== activeUserId);
  const visibleReviews = useMemo(
    () => (reviewsLoading ? [] : currentUserReviews.slice(0, 10)),
    [currentUserReviews, reviewsLoading],
  );

  const profileDisplayName =
    resolvedUser?.name?.trim() || resolvedUser?.username?.trim() || "User";

  if (!normalizedRequestedUsername) {
    return (
      <ProfileNotFoundState message="The profile link is missing a username." />
    );
  }

  if (!profileLoading && !resolvedUser) {
    return (
      <ProfileNotFoundState
        message={profileError || "This user does not exist."}
      />
    );
  }

  return (
    <>
      <main className="box-border min-h-[calc(100vh-73px)] bg-[#050505] px-3 py-6 text-white sm:px-6 sm:py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-4 sm:gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {sidebarLoading || !resolvedUser ? (
            <ProfileSidebarSkeleton />
          ) : (
            <ProfileSidebar
              user={resolvedUser}
              isOwnProfile={isOwnProfile}
              providerLabel={isOwnProfile ? providerLabel : undefined}
              userReviewsCount={reviewsLoading ? null : currentUserReviews.length}
              totalPreferenceCount={
                isOwnProfile ? totalPreferenceCount : undefined
              }
              preferenceSummary={isOwnProfile ? preferenceSummary : undefined}
              onEditProfile={
                isOwnProfile ? () => setProfileSettingsOpen(true) : undefined
              }
              onEditInterests={
                isOwnProfile ? () => setPreferencesModalOpen(true) : undefined
              }
            />
          )}

          <section className="min-w-0 space-y-4 sm:space-y-6">
            <section className={`${panelClassName} overflow-hidden`}>
              <div className="border-b border-white/8 bg-[#101010] px-4 py-4 sm:px-8 sm:py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  {sidebarLoading || !resolvedUser ? (
                    <div>
                      <Skeleton className="h-11 w-34 rounded-md bg-white/8" />
                      <Skeleton className="mt-4 h-9 w-64 max-w-full bg-white/10" />
                      <div className="mt-3 space-y-2">
                        <Skeleton className="h-4 w-full max-w-2xl bg-white/8" />
                        <Skeleton className="h-4 w-4/5 max-w-xl bg-white/8" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="inline-flex max-w-full items-center rounded-md border border-white/10 bg-[#141414] p-1">
                        <span className="inline-flex items-center gap-2 rounded-[0.45rem] bg-[#3b3b3b] px-4 py-2 text-sm font-medium text-white">
                          <MessageCircle className="h-4 w-4" />
                          Reviews
                        </span>
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-[2.05rem]">
                        {isOwnProfile
                          ? "Your latest writing"
                          : `${getPossessiveLabel(profileDisplayName)} latest writing`}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58 sm:text-base">
                        {isOwnProfile
                          ? "A cleaner review wall with a flatter black UI, sharper cards, and direct access back to each movie page."
                          : `Recent public reviews from ${profileDisplayName} on CineAI.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-8">
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <ReviewPreviewCardSkeleton key={item} />
                    ))}
                  </div>
                ) : visibleReviews.length > 0 ? (
                  <div className="space-y-4">
                    {visibleReviews.map((review, index) => (
                      <ReviewPreviewCard
                        key={review._id || `${review.movie.imdbId}-${index}`}
                        review={review}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center">
                    <BadgePlus className="mx-auto h-8 w-8 text-white/65" />
                    <h3 className="mt-4 text-xl font-semibold text-white">
                      No reviews posted yet
                    </h3>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/60">
                      {isOwnProfile
                        ? "Once you write reviews on movie pages, they will appear here as quick-access cards so you can revisit the same title page in one tap."
                        : "This profile has not posted any public reviews yet."}
                    </p>
                    {isOwnProfile && (
                      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                          href="/"
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-[#141414] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#191919]"
                        >
                          Start exploring
                        </Link>
                        <Link
                          href="/support"
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-[#141414] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#191919]"
                        >
                          <Mail className="h-4 w-4" />
                          Support
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </section>
        </div>
      </main>

      {isOwnProfile && (
        <>
          <UserPreferencesModal
            open={preferencesModalOpen}
            onOpenChange={setPreferencesModalOpen}
          />
          <ProfileSettingsModal
            open={profileSettingsOpen}
            onOpenChange={setProfileSettingsOpen}
            user={authUser}
          />
        </>
      )}
    </>
  );
}
