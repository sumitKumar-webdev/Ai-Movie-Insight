"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import ReviewCard from "@/app/components/cards/Review-card";
import DeleteConfirmModal from "@/app/modal/delete-confirm-modal";
import { buildApiUrl } from "@/app/services/api-client";
import { getMovieReviews } from "@/app/services/movie.service";
import { MovieInsight, Review } from "@/app/modal/service.modal";

type ReviewsSectionProps = {
  imdbId: string;
  movieTitle: string;
  currentUserId: string;
  ensureAuthenticated: () => Promise<boolean>;
  onUnauthorized: () => void;
  onRefreshInsight: () => Promise<void>;
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
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    setReviewInput("");
    setReviewError("");
    setReviewMessage("");
    setEditingReviewId(null);
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

  const refreshReviewsAndInsight = async () => {
    await loadReviews(imdbId, setReviewsLoading, setCommunityReviews);
    await onRefreshInsight();
  };

  const submitReview = async () => {
    const message = reviewInput.trim();
    if (!message || !imdbId) return;

    setReviewError("");
    setReviewMessage("");

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await fetch(
        buildApiUrl(
          isEditingOwnReview && userReview?._id
            ? `/api/reviews/${userReview._id}`
            : "/api/reviews",
        ),
        {
          method: isEditingOwnReview ? "PATCH" : "POST",
          credentials: "include",
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

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setReviewError(payload.error ?? "Unable to save your review");
        return;
      }

      setReviewInput("");
      setReviewError("");
      setReviewMessage(
        isEditingOwnReview ? "Your review was updated." : "Your review was added.",
      );
      setEditingReviewId(null);
      await refreshReviewsAndInsight();
    } finally {
      setSubmittingReview(false);
    }
  };

  const removeReview = async () => {
    if (!userReview?._id) return;

    setReviewError("");
    setReviewMessage("");

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await fetch(buildApiUrl(`/api/reviews/${userReview._id}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setReviewError(payload.error ?? "Unable to delete your review");
        return;
      }

      setReviewInput("");
      setReviewError("");
      setReviewMessage("Your review was deleted.");
      setEditingReviewId(null);
      setShowDeleteModal(false);
      await refreshReviewsAndInsight();
    } finally {
      setSubmittingReview(false);
    }
  };

  const likeReview = async (reviewId: string) => {
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return;
    }

    const response = await fetch(buildApiUrl(`/api/reviews/${reviewId}/likes`), {
      method: "POST",
      credentials: "include",
    });

    if (response.status === 401) {
      onUnauthorized();
      return;
    }

    await refreshReviewsAndInsight();
  };

  const replyToReview = async (reviewId: string, message: string) => {
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return;
    }

    const response = await fetch(buildApiUrl(`/api/reviews/${reviewId}/replies`), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (response.status === 401) {
      onUnauthorized();
      return;
    }

    await loadReviews(imdbId, setReviewsLoading, setCommunityReviews);
  };

  const startEditingReview = (review: Review) => {
    setReviewMessage("");
    setReviewError("");
    setEditingReviewId(review._id ?? null);
    setReviewInput(review.text ?? "");
  };

  return (
    <>
      <Card className="border-none bg-white/3 text-white">
        <CardHeader>
          {reviewsLoading ? (
            <Skeleton className="h-8 w-40 bg-white/12" />
          ) : (
            <CardTitle className="text-xl md:text-2xl">Audience Reviews</CardTitle>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {!reviewsLoading && shouldShowComposer ? (
            <form
              className="rounded-xl border border-white/10 bg-black/30 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void submitReview();
              }}
            >
              <p className="mb-2 text-xs font-semibold tracking-wide text-white/60 uppercase">
                {isEditingOwnReview ? "Edit Your Review" : "Add Your Review"}
              </p>

              <Textarea
                value={reviewInput}
                onChange={(event) => setReviewInput(event.target.value)}
                placeholder="Write your review about this movie..."
                className="min-h-24 resize-y border-white/15 bg-white/5 text-white placeholder:text-white/45 focus-visible:border-white/30 focus-visible:ring-white/10"
              />

              {reviewError ? (
                <p className="mt-3 text-sm text-rose-300">{reviewError}</p>
              ) : null}

              {reviewMessage ? (
                <p className="mt-3 text-sm text-emerald-300">{reviewMessage}</p>
              ) : null}

              <div className="mt-3 flex justify-end gap-2">
                {isEditingOwnReview ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingReviewId(null);
                      setReviewInput("");
                    }}
                    disabled={submittingReview}
                    className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                ) : null}

                <Button
                  type="submit"
                  disabled={submittingReview || !reviewInput.trim()}
                  className="bg-white text-black hover:bg-white/90"
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
            </form>
          ) : null}

          {!reviewsLoading && !shouldShowComposer && reviewMessage ? (
            <p className="text-sm text-emerald-300">{reviewMessage}</p>
          ) : null}

          {!reviewsLoading && !shouldShowComposer && reviewError ? (
            <p className="text-sm text-rose-300">{reviewError}</p>
          ) : null}

          {!reviewsLoading && orderedReviews.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
                Community Comments
              </p>

              {orderedReviews.map((review) => {
                const isOwnReview = Boolean(
                  review.userId && review.userId === currentUserId,
                );

                return (
                  <ReviewCard
                    key={review._id ?? review.date}
                    reviewId={review._id}
                    name={review.author}
                    reviewDate={
                      review.date ? new Date(review.date).toLocaleDateString() : ""
                    }
                    review={review.text}
                    likes={review.likes ?? 0}
                    replies={review.replies ?? []}
                    isOwnReview={isOwnReview}
                    highlightAsOwner={isOwnReview}
                    canEdit={isOwnReview}
                    canDelete={isOwnReview}
                    canReport={!isOwnReview}
                    onEdit={
                      isOwnReview ? () => startEditingReview(review) : undefined
                    }
                    onDelete={
                      isOwnReview ? () => setShowDeleteModal(true) : undefined
                    }
                    onReport={
                      !isOwnReview
                        ? () => {
                            setReviewError("");
                            setReviewMessage(
                              "Report support is not connected yet. We will add it soon.",
                            );
                          }
                        : undefined
                    }
                    onLike={
                      review._id ? () => void likeReview(review._id as string) : undefined
                    }
                    onReply={
                      review._id
                        ? async (message) => {
                            await replyToReview(review._id as string, message);
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          ) : null}

          {!reviewsLoading && orderedReviews.length === 0 ? (
            <p className="text-sm text-white/65">
              No community reviews yet. Share yours to help power the AI insight.
            </p>
          ) : null}
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
    </>
  );
}
