"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgePlus, Mail, MessageCircle } from "lucide-react";
import ProfileSidebar, {
  ProfileSidebarSkeleton,
} from "@/app/(page)/profile/profile-sidebar";
import { Skeleton } from "@/app/components/ui/skeleton";
import ProfileSettingsModal from "@/app/modal/profile-settings-modal";
import UserPreferencesModal from "@/app/modal/user-preferences-modal";
import { Review } from "@/app/models/service.modal";
import { getUserReviews } from "@/app/services/review.service";
import { getMovieByImdbId } from "@/app/services/movie.service";
import { useAuthStore } from "@/app/store/store";
import { ReviewPreviewCard } from "@/app/components/cards/review-preview-card";

const panelClassName =
  "rounded-[1.05rem] border border-white/10 bg-[#0a0a0a] shadow-[0_18px_44px_rgba(0,0,0,0.28)]";

const preferenceGroups = [
  { key: "cinemas", label: "Industries" },
  { key: "languages", label: "Languages" },
  { key: "genres", label: "Genres" },
  { key: "moods", label: "Moods" },
  { key: "formats", label: "Formats" },
] as const;

function ReviewPreviewCardSkeleton() {
  return (
    <div className="rounded-[0.95rem] border border-white/8 bg-[#0f0f0f] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="mx-auto aspect-[0.7] w-full max-w-[132px] rounded-[0.7rem] bg-white/8 sm:mx-0 sm:h-[148px] sm:w-[102px] sm:max-w-none sm:aspect-auto lg:h-[180px] lg:w-[124px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="mt-4 h-7 w-2/3 bg-white/8" />
            </div>
            <Skeleton className="h-8 w-full rounded-md bg-white/8 sm:w-24" />
          </div>
          <Skeleton className="mt-4 h-4 w-full bg-white/8" />
          <Skeleton className="mt-2 h-4 w-11/12 bg-white/8" />
          <Skeleton className="mt-2 h-4 w-9/12 bg-white/8" />
          <div className="mt-5 flex justify-center gap-3 border-t border-white/6 pt-4 sm:justify-start">
            <Skeleton className="h-4 w-12 bg-white/8" />
            <Skeleton className="h-4 w-12 bg-white/8" />
            <Skeleton className="h-4 w-24 bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileReviewsSectionSkeleton() {
  return (
    <section className={`${panelClassName} overflow-hidden`}>
      <div className="border-b border-white/8 bg-[#101010] px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Skeleton className="h-11 w-34 rounded-md bg-white/8" />
            <Skeleton className="mt-4 h-9 w-64 max-w-full bg-white/10" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full max-w-2xl bg-white/8" />
              <Skeleton className="h-4 w-4/5 max-w-xl bg-white/8" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-8">
        {[1, 2, 3].map((item) => (
          <ReviewPreviewCardSkeleton key={item} />
        ))}
      </div>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#050505] px-3 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-4 sm:gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ProfileSidebarSkeleton />
        <ProfileReviewsSectionSkeleton />
      </div>
    </main>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((auth) => auth.user);
  const status = useAuthStore((auth) => auth.status);
  const activeUserId = user?.id ?? "";
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<
    Array<
      Review & {
        posterUrl?: string | null;
        movieYear?: string;
        movieType?: string;
      }
    >
  >([]);
  const [loadedReviewsUserId, setLoadedReviewsUserId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (status !== "authenticated" || !activeUserId) return;

    void getUserReviews(activeUserId, { limit: 10 })
      .then(async (reviews) => {
        const authoredReviews = Array.isArray(reviews) ? reviews : [];
        const reviewsWithPosters = await Promise.all(
          authoredReviews.map(async (review) => {
            const imdbId = review.movie?.imdbId?.trim();
            if (!imdbId) return review;

            try {
              const movie = await getMovieByImdbId(imdbId);
              return {
                ...review,
                posterUrl: movie.poster,
                movieYear: movie.year,
                movieType: movie.type,
              };
            } catch {
              return review;
            }
          }),
        );

        setUserReviews(reviewsWithPosters);
        setLoadedReviewsUserId(activeUserId);
      })
      .catch(() => {
        setUserReviews([]);
        setLoadedReviewsUserId(activeUserId);
      });
  }, [activeUserId, status]);

  const providerLabel = user?.authProvider?.length
    ? user.authProvider
        .map((provider) => provider.charAt(0).toUpperCase() + provider.slice(1))
        .join(", ")
    : "Email";

  const preferenceSummary = useMemo(
    () =>
      preferenceGroups.map((group) => ({
        ...group,
        items: Array.isArray(user?.preferences?.[group.key])
          ? user.preferences[group.key]
          : [],
      })),
    [user],
  );

  const totalPreferenceCount = preferenceSummary.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  const reviewsLoading =
    status === "authenticated" &&
    Boolean(activeUserId) &&
    loadedReviewsUserId !== activeUserId;

  const showProfileContentSkeleton = reviewsLoading;

  const visibleReviews = useMemo(
    () => (reviewsLoading ? [] : userReviews.slice(0, 10)),
    [reviewsLoading, userReviews],
  );

  if (status === "idle" || status === "loading") {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <main className="min-h-[calc(100vh-73px)] bg-[#050505] px-3 py-6 text-white sm:px-6 sm:py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-4 sm:gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {showProfileContentSkeleton ? (
            <ProfileSidebarSkeleton />
          ) : (
            <ProfileSidebar
              user={user}
              providerLabel={providerLabel}
              userReviewsCount={userReviews.length}
              totalPreferenceCount={totalPreferenceCount}
              preferenceSummary={preferenceSummary}
              onEditProfile={() => setProfileSettingsOpen(true)}
              onEditInterests={() => setPreferencesModalOpen(true)}
            />
          )}

          <section className="min-w-0 space-y-4 sm:space-y-6">
            {showProfileContentSkeleton ? (
              <ProfileReviewsSectionSkeleton />
            ) : (
              <section className={`${panelClassName} overflow-hidden`}>
                <div className="border-b border-white/8 bg-[#101010] px-4 py-4 sm:px-8 sm:py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="inline-flex max-w-full items-center rounded-md border border-white/10 bg-[#141414] p-1">
                        <span className="inline-flex items-center gap-2 rounded-[0.45rem] bg-[#3b3b3b] px-4 py-2 text-sm font-medium text-white">
                          <MessageCircle className="h-4 w-4" />
                          Reviews
                        </span>
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-[2.05rem]">
                        Your latest writing
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58 sm:text-base">
                        A cleaner review wall with a flatter black UI, sharper
                        cards, and direct access back to each movie page.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-8">
                  {visibleReviews.length > 0 ? (
                    <div className="space-y-4">
                      {visibleReviews.map((review, index) => (
                        <ReviewPreviewCard
                          key={review._id || `${review.movie.imdbId}-${index}`}
                          review={review}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[0.95rem] border border-dashed border-white/12 bg-[#0f0f0f] px-6 py-10 text-center">
                      <BadgePlus className="mx-auto h-8 w-8 text-white/65" />
                      <h3 className="mt-4 text-xl font-semibold text-white">
                        No reviews posted yet
                      </h3>
                      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/60">
                        Once you write reviews on movie pages, they will appear
                        here as quick-access cards so you can revisit the same
                        title page in one tap.
                      </p>
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
                    </div>
                  )}
                </div>
              </section>
            )}
          </section>
        </div>
      </main>

      <UserPreferencesModal
        open={preferencesModalOpen}
        onOpenChange={setPreferencesModalOpen}
      />
      <ProfileSettingsModal
        open={profileSettingsOpen}
        onOpenChange={setProfileSettingsOpen}
        user={user}
      />
    </>
  );
}
