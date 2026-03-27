"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";
import LimitTextarea from "@/app/components/limitTextarea/limit-textarea";
import ReviewRepliesModal from "@/app/components/reviews/review-replies-modal";
import DeleteConfirmModal from "@/app/modal/delete-confirm-modal";
import { authenticatedFetch } from "@/app/services/api-client";
import { getMovieReviews } from "@/app/services/movie.service";
import { toast } from "@/app/Hooks/use-toast";
import { MovieInsight, Review } from "@/app/modal/service.modal";
import ReviewCard from "@/app/components/cards/Review-card";

type ReviewsSectionProps = {
  imdbId: string;
  movieTitle: string;
  currentUserId: string;
  ensureAuthenticated: () => Promise<boolean>;
  onUnauthorized: () => void;
  onRefreshInsight: () => void;
};

type ReviewMutationResponse = {
  message?: string;
  status?: boolean;
  data?: {
    review?: Review;
    reviewId?: string;
  };
};

async function loadReviews(
  imdbId: string,
  setLoading: (value: boolean) => void,
  setCommunityReviews: (value: MovieInsight["communityReviews"]) => void,
) {
  if (!imdbId) {
    setLoading(false);
    return;
  }

  setLoading(true);

  try {
    const reviewsResponse = await getMovieReviews(imdbId);
    setCommunityReviews(reviewsResponse);
  } catch {
    setCommunityReviews([]);
  } finally {
    setLoading(false);
  }
}

export default function ReviewsSection({
  imdbId,
  movieTitle,
  currentUserId,
  ensureAuthenticated,
  onUnauthorized,
  onRefreshInsight,
}: ReviewsSectionProps) {
  const [communityReviews, setCommunityReviews] = useState<
    MovieInsight["communityReviews"]
  >([]);
  const [reviewInput, setReviewInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [activeReplyReview, setActiveReplyReview] = useState<Review | null>(
    null,
  );
  const [repliesModalOpen, setRepliesModalOpen] = useState(false);

  useEffect(() => {
    setReviewInput("");
    setEditingReviewId(null);
    setActiveReplyReview(null);
    setRepliesModalOpen(false);
    void loadReviews(imdbId, setReviewsLoading, setCommunityReviews);
  }, [imdbId]);

  const filteredReviews = useMemo(
    () =>
      (communityReviews ?? []).filter(
        (review) => typeof review?.text === "string" && review.text.trim(),
      ),
    [communityReviews],
  );

  const userReview = useMemo(
    () =>
      filteredReviews.find((review) =>
        Boolean(currentUserId && review?.userId === currentUserId),
      ),
    [currentUserId, filteredReviews],
  );

  const orderedReviews = useMemo(() => {
    if (!userReview?._id) return filteredReviews;

    return [
      userReview,
      ...filteredReviews.filter((review) => review._id !== userReview._id),
    ];
  }, [filteredReviews, userReview]);

  const isEditingOwnReview = Boolean(
    userReview?._id && editingReviewId === userReview._id,
  );
  const shouldShowComposer = !userReview || isEditingOwnReview;

  const openRepliesModal = (review: Review) => {
    if (!currentUserId) {
      onUnauthorized();
      return;
    }

    setActiveReplyReview(review);
    setRepliesModalOpen(true);
  };

  const upsertReview = (nextReview: Review) => {
    setCommunityReviews((previousReviews = []) => {
      const filtered = previousReviews.filter(
        (review) =>
          review._id !== nextReview._id && review.userId !== nextReview.userId,
      );

      return [nextReview, ...filtered];
    });
    setActiveReplyReview((currentReview) =>
      currentReview?._id === nextReview._id ? nextReview : currentReview,
    );
  };

  const removeReviewFromState = (reviewId: string) => {
    setCommunityReviews((previousReviews = []) =>
      previousReviews.filter((review) => review._id !== reviewId),
    );
    setActiveReplyReview((currentReview) =>
      currentReview?._id === reviewId ? null : currentReview,
    );
  };

  const submitReview = async () => {
    const message = reviewInput.trim();
    if (!message || !imdbId) return;
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      onUnauthorized();
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await authenticatedFetch(
        isEditingOwnReview && userReview?._id
          ? `/api/reviews/${userReview._id}`
          : "/api/reviews",
        {
          method: isEditingOwnReview ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            movieImdbId: imdbId,
            movieTitle,
          }),
        },
      );

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const payload = (await response.json()) as ReviewMutationResponse;
      if (!response.ok) {
        toast({
          title: payload.message ?? "Unable to save your review",
          variant: "destructive",
        });
        return;
      }

      setReviewInput("");
      if (payload.data?.review) {
        upsertReview(payload.data.review);
      }

      toast({
        title: isEditingOwnReview ? "Review updated" : "Review posted",
        description: isEditingOwnReview
          ? "Your updated review is now live."
          : "Your review was added successfully.",
        variant: "success",
      });
      setEditingReviewId(null);
      await onRefreshInsight();
    } finally {
      setSubmittingReview(false);
    }
  };

  const removeReview = async () => {
    if (!userReview?._id) return;
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      onUnauthorized();
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await authenticatedFetch(`/api/reviews/${userReview._id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const payload = (await response.json()) as ReviewMutationResponse;
      if (!response.ok) {
        toast({
          title: payload.message ?? "Unable to delete your review",
          variant: "destructive",
        });
        return;
      }
      setReviewInput("");
      removeReviewFromState(userReview._id);
      toast({
        title: "Review deleted",
        description: "Your review was removed successfully.",
        variant: "success",
      });
      setEditingReviewId(null);
      setShowDeleteModal(false);
      await onRefreshInsight();
    } finally {
      setSubmittingReview(false);
    }
  };

  const likeReview = async (reviewId: string) => {
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      onUnauthorized();
      return;
    }

    const response = await authenticatedFetch(`/api/reviews/${reviewId}/likes`, {
      method: "POST",
    });

    if (response.status === 401) {
      onUnauthorized();
      return;
    }

    const payload = (await response.json()) as {
      message?: string;
      status?: boolean;
      data?: { totalLikes?: number; liked?: boolean };
    };

    if (!response.ok) {
      toast({
        title: payload.message ?? "Unable to update review like",
        variant: "destructive",
      });
      return;
    }

    setCommunityReviews((previousReviews = []) =>
      previousReviews.map((review) =>
        review._id === reviewId
          ? {
              ...review,
              likes: payload.data?.totalLikes ?? review.likes ?? 0,
              liked: payload.data?.liked ?? review.liked ?? false,
            }
          : review,
      ),
    );
    setActiveReplyReview((currentReview) =>
      currentReview?._id === reviewId
        ? {
            ...currentReview,
            likes: payload.data?.totalLikes ?? currentReview.likes ?? 0,
            liked: payload.data?.liked ?? currentReview.liked ?? false,
          }
        : currentReview,
    );
  };

  const startEditingReview = (review: Review) => {
    setEditingReviewId(review._id ?? null);
    setReviewInput(review.text ?? "");
  };

  return (
    <section className="-px-4">
      <Card className="border-none bg-white/3 text-white">
        <CardHeader>
          {reviewsLoading ? (
            <Skeleton className="h-8 w-40 bg-white/12" />
          ) : (
            <CardTitle className="text-xl md:text-2xl">
              Audience Reviews
            </CardTitle>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {!reviewsLoading && shouldShowComposer && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitReview();
              }}
            >
              <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-cyan-200/70 uppercase">
                {isEditingOwnReview ? "Edit Your Review" : "Add Your Review"}
              </p>
              <p className="mb-4 text-sm text-white/60">
                Share a thoughtful take to help other movie watchers and improve
                the AI insight.
              </p>

              <LimitTextarea
                limit={500}
                value={reviewInput}
                onChange={setReviewInput}
                onFocus={() => {
                  if (!currentUserId) {
                    onUnauthorized();
                  }
                }}
                placeholder="Write your review about this movie..."
                rows={5}
                className="min-h-32 rounded-md bg-black/25 px-4 py-3 text-white placeholder:text-white/35"
                readOnly={!currentUserId}
              />

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/45">
                  Tip: specific scenes, performances, and pacing notes make
                  reviews more useful.
                </p>
                <div className="flex justify-end gap-2">
                  {isEditingOwnReview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingReviewId(null);
                        setReviewInput("");
                      }}
                      disabled={submittingReview}
                      className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      submittingReview ||
                      (!!currentUserId && !reviewInput.trim())
                    }
                    className="rounded-full bg-white px-5 text-black hover:bg-cyan-50"
                  >
                    {submittingReview
                      ? isEditingOwnReview
                        ? "Saving..."
                        : "Posting..."
                      : isEditingOwnReview
                        ? "Update Review"
                        : "Post Review"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {!reviewsLoading && orderedReviews.length > 0 ? (
            <div className="space-y-3">
              {orderedReviews.map((review) => {
                const isOwnReview = Boolean(
                  review.userId && review.userId === currentUserId,
                );

                return (
                  <ReviewCard
                    key={review._id ?? review.date}
                    review={review}
                    isOwnReview={isOwnReview}
                    onEdit={
                      isOwnReview ? () => startEditingReview(review) : undefined
                    }
                    onDelete={
                      isOwnReview ? () => setShowDeleteModal(true) : undefined
                    }
                    onReport={
                      !isOwnReview
                        ? () =>
                            toast({
                              title: "This feature is still under development",
                              variant: "default",
                            })
                        : undefined
                    }
                    onLike={
                      review._id
                        ? () => likeReview(review._id as string)
                        : undefined
                    }
                    onOpenReplies={() => openRepliesModal(review)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/65">
              No community reviews yet. Share yours to help power the AI
              insight.
            </p>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={removeReview}
        title="Delete your review?"
        subtitle="Your review will be removed permanently and the AI insight will refresh after deletion."
        confirmLabel="Delete review"
      />

      <ReviewRepliesModal
        open={repliesModalOpen}
        onOpenChange={setRepliesModalOpen}
        reviewId={activeReplyReview?._id}
        review={activeReplyReview}
        currentUserId={currentUserId}
        onUnauthorized={onUnauthorized}
        onReviewMutated={onRefreshInsight}
      />
    </section>
  );
}
