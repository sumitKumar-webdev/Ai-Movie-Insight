"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { toast } from "@/app/Hooks/use-toast";
import { Review, ReviewReply } from "@/app/modal/service.modal";
import {
  addReviewReply,
  deleteReviewReply,
  getReviewReplies,
  likeReviewReply,
} from "@/app/services/movie.service";
import { formatLabel, getInitials } from "@/lib/resuable-component";
import { Input } from "../ui/input";

type ReviewRepliesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId?: string;
  review: Review | null;
  currentUserId: string;
  onUnauthorized: () => void;
  onReviewMutated: () => void;
};

export default function ReviewRepliesModal({
  open,
  onOpenChange,
  reviewId,
  review,
  currentUserId,
  onUnauthorized,
  onReviewMutated,
}: ReviewRepliesModalProps) {
  const [replyDraft, setReplyDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(review);
  const [replies, setReplies] = useState<ReviewReply[]>([]);

  useEffect(() => {
    setSelectedReview(review);
  }, [review]);

  useEffect(() => {
    if (!open || !reviewId) {
      return;
    }

    let cancelled = false;

    const loadReplies = async () => {
      try {
        setLoading(true);
        setError("");
        const payload = await getReviewReplies(reviewId);

        if (!payload.ok) {
          if (!cancelled) {
            setError(payload.message ?? "Unable to load replies");
          }
          return;
        }

        if (!cancelled) {
          setSelectedReview(payload.data?.review ?? review);
          setReplies(
            Array.isArray(payload.data?.replies) ? payload.data.replies : [],
          );
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load replies");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReplies();

    return () => {
      cancelled = true;
    };
  }, [open, review, reviewId]);

  const refreshReplies = async () => {
    if (!reviewId) {
      return;
    }

    const payload = await getReviewReplies(reviewId);
    if (!payload.ok) {
      throw new Error(payload.message ?? "Unable to load replies");
    }

    setSelectedReview(payload.data?.review ?? review);
    setReplies(
      Array.isArray(payload.data?.replies) ? payload.data.replies : [],
    );
  };

  const submitReply = async () => {
    if (!reviewId || !replyDraft.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = await addReviewReply(reviewId, replyDraft.trim());

      if (payload.status === 401) {
        onUnauthorized();
        return;
      }

      if (!payload.ok) {
        setError(payload.message ?? "Unable to add reply");
        return;
      }

      setReplyDraft("");
      await refreshReplies();
      await onReviewMutated();
      toast({
        title: "Reply added",
        description: "Your reply is now part of the conversation.",
        variant: "success",
      });
    } catch (replyError) {
      setError(
        replyError instanceof Error
          ? replyError.message
          : "Unable to add reply",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyLike = async (replyId: string) => {
    if (!reviewId) {
      return;
    }

    const payload = await likeReviewReply(reviewId, replyId);

    if (payload.status === 401) {
      onUnauthorized();
      return;
    }

    if (!payload.ok) {
      setError(payload.message ?? "Unable to update reply like");
      return;
    }

    await refreshReplies();
  };

  const handleReplyDelete = async (replyId: string) => {
    if (!reviewId) {
      return;
    }

    const payload = await deleteReviewReply(reviewId, replyId);

    if (payload.status === 401) {
      onUnauthorized();
      return;
    }

    if (!payload.ok) {
      setError(payload.message ?? "Unable to delete reply");
      return;
    }

    await refreshReplies();
    await onReviewMutated();
    toast({
      title: "Reply deleted",
      description: "The reply was removed successfully.",
      variant: "success",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-dvh w-screen max-w-none rounded-none border-0 bg-black/70 p-0 text-white sm:h-[min(90vh,860px)] sm:w-[min(96vw,76rem)] sm:rounded-3xl sm:border sm:border-white/10">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-white/10 px-4 py-4 text-left sm:px-6">
            <p className="text-brand-primary-muted text-xs font-semibold tracking-[0.22em] uppercase">
              Discussion
            </p>
            <DialogTitle className="text-xl font-semibold sm:text-2xl">
              Review thread
            </DialogTitle>
            <DialogDescription className="text-sm text-white/55">
              Jump into the full conversation and keep replies in one place.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
            <section className="border-b border-white/10 bg-white/0.3 px-4 py-4 lg:min-h-0 lg:border-r lg:border-b-0 lg:px-6 lg:py-6">
              {loading && !selectedReview ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 rounded-3xl bg-white/10" />
                  <Skeleton className="h-40 rounded-3xl bg-white/10" />
                </div>
              ) : selectedReview ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/8 text-sm font-semibold text-white/90">
                      {getInitials(selectedReview.author)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white">
                        {formatLabel(selectedReview.author)}
                      </p>
                      <p className="text-xs text-white/55">
                        {selectedReview.date
                          ? new Date(selectedReview.date).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-[#0d121b] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:rounded-[1.75rem] sm:p-5">
                    <p className="text-sm leading-7 text-white/88">
                      {selectedReview.text || "No review text provided."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
                    <Heart className="h-4 w-4" />
                    <span>{selectedReview.likes ?? 0} likes</span>
                    <span className="text-white/25">•</span>
                    <MessageCircle className="h-4 w-4" />
                    <span>
                      {selectedReview.replyCount ?? replies.length} replies
                    </span>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="flex min-h-0 flex-col px-4 py-4 sm:px-6 sm:py-6">
              <div className="min-h-0 flex-1 overflow-y-auto pr-0 sm:pr-1">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <Skeleton
                        key={item}
                        className="h-28 rounded-3xl bg-white/10"
                      />
                    ))}
                  </div>
                ) : replies.length > 0 ? (
                  <div className="space-y-3">
                    {replies.map((reply) => {
                      const isOwnReply = Boolean(
                        currentUserId && reply.userId === currentUserId,
                      );
                      return (
                        <div
                          key={reply._id ?? `${reply.author}-${reply.date}`}
                            className="rounded-[1.2rem] border border-white/8 bg-[#10161f] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:rounded-[1.35rem]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {formatLabel(reply.author)}
                              </p>
                              <p className="mt-1 text-[11px] text-white/50">
                                {reply.date
                                  ? new Date(reply.date).toLocaleDateString()
                                  : ""}
                              </p>
                            </div>
                            {isOwnReply ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  reply._id && void handleReplyDelete(reply._id)
                                }
                                className="text-white/55 hover:bg-white/8 hover:text-brand-primary"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-7 text-white/85">
                            {reply.text}
                          </p>
                          <div className="mt-4 flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                reply._id && void handleReplyLike(reply._id)
                              }
                              className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                            >
                              <Heart className="h-4 w-4" />
                              {reply.likes ?? 0}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-white/65">
                    No replies yet. Start the conversation from here.
                  </p>
                )}
              </div>
              <div className="border-t border-white/55 pt-2 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                <div className="mb-2 flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
                  <Input
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder="Share your take on this review..."
                    className="min-h-11 border-white/12 bg-[#10161f] text-white placeholder:text-white/35"
                  />
                  <Button
                    type="button"
                    disabled={submitting || !replyDraft.trim()}
                    onClick={() => void submitReply()}
                    className="w-full h-11 bg-[#d7e8f7] text-slate-950 hover:bg-[#c6ddf2] sm:w-auto"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Reply
                  </Button>
                </div>
                {error ? (
                  <p className="mt-3 text-sm text-rose-300 text-center">{error}</p>
                ) : (
                  <p className="mt-3 text-sm text-white/65 text-center">
                    Please Keep this conversation healthy
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
