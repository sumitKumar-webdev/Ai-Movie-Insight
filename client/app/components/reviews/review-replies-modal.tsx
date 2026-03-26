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
import RenderAvatar from "../avatar/render-avatar";

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
      <DialogContent className="h-dvh max-h-dvh w-screen max-w-none overflow-hidden rounded-none border-0 bg-black/70 p-0 text-white sm:h-[min(90vh,860px)] sm:max-h-[90vh] sm:w-[min(96vw,76rem)] sm:rounded-3xl sm:border sm:border-white/10">
        <div className="flex h-full min-h-0 flex-col">
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

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:grid lg:overflow-hidden lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
            <section className="home-search-scroll border-b border-white/10 bg-white/0.3 px-4 py-4 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-6 lg:py-6">
              {loading && !selectedReview ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 rounded-3xl bg-white/10" />
                  <Skeleton className="h-40 rounded-3xl bg-white/10" />
                </div>
              ) : selectedReview ? (
                <div className="space-y-2 md:space-y-4">
                  <div className="flex max-w-[75%] items-center gap-3">
                    <RenderAvatar
                      name={selectedReview.author}
                      imageUrl={selectedReview.imageUrl}
                    />
                    <div className="min-w-0 -space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-lg">
                          {formatLabel(selectedReview.author)}
                        </h4>
                      </div>
                      <p className="text-sm text-[#A0A0A0]">
                        @{selectedReview.username}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-white/88">
                    {selectedReview.text || "No review text provided."}
                  </p>

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

            <section className="flex min-h-0 flex-col px-4 py-4 lg:overflow-hidden sm:px-2 sm:py-3">
              <div className="min-h-0 flex-1 home-search-scroll pr-0 lg:overflow-y-auto lg:overscroll-contain sm:pr-1">
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
                      const replyDate = reply.date
                        ? new Date(reply.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Just now";
                      return (
                        <div
                          key={reply._id ?? `${reply.author}-${reply.date}`}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-start gap-3">
                            <RenderAvatar
                              name={reply.author}
                              imageUrl={reply.imageUrl}
                              className="h-5 w-5"
                              initialsClassName="font-medium text-xs md:text-sm"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center">
                                    <p className="truncate text-sm font-semibold text-[#FFFFFF]">
                                      {reply.username?.trim() ||
                                        formatLabel(reply.author)}
                                    </p>
                                  </div>

                                  <div className="mb-2 wrap-break-word text-sm leading-4.25 text-[#C6C6C6]">
                                    <span>{reply.text}</span>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <span className="text-[13px] font-normal text-[#919191]">
                                      {replyDate}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        reply._id &&
                                        void handleReplyLike(reply._id)
                                      }
                                      aria-label="Like reply"
                                      className="relative flex items-center justify-center p-1 text-[#919191] transition-transform duration-100 hover:text-white active:scale-95 gap-1"
                                    >
                                      <Heart
                                        className="h-4 w-4 fill-none stroke-current"
                                        strokeWidth={1.5}
                                      />
                                      {reply.likes ?? 0}
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-1 flex shrink-0 flex-col items-center -ml-1">
                                  {isOwnReply ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        reply._id &&
                                        void handleReplyDelete(reply._id)
                                      }
                                      aria-label="Delete reply"
                                      className="mt-2 inline-flex items-center justify-center rounded-full p-1 text-[#919191] transition hover:bg-white/10 hover:text-white"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
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
              <div className="hidden border-t border-white/15 pt-2 shadow-[0_18px_50px_rgba(0,0,0,0.24)] lg:block">
                <div className="mb-2 flex items-center gap-2 pt-1">
                  <Input
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder="Share your take on this review..."
                    className="min-h-11 flex-1 border-white/12 bg-[#10161f] text-white placeholder:text-white/35"
                  />
                  <Button
                    type="button"
                    disabled={submitting || !replyDraft.trim()}
                    onClick={() => void submitReply()}
                    className="h-11 shrink-0 bg-[#d7e8f7] px-4 text-slate-950 hover:bg-[#c6ddf2]"
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
                  <p className="mt-3 text-center text-sm text-rose-300">
                    {error}
                  </p>
                ) : (
                  <p className="mt-3 text-center text-sm text-white/65">
                    Please Keep this conversation healthy
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 z-10 border-t border-white/15 bg-black/85 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.24)] lg:hidden">
            <div className="px-4 pt-2 sm:px-6">
              <div className="mb-2 flex items-center gap-2 pt-1">
                <Input
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  placeholder="Share your take on this review..."
                  className="min-h-11 flex-1 border-white/12 bg-[#10161f] text-white placeholder:text-white/35"
                />
                <Button
                  type="button"
                  disabled={submitting || !replyDraft.trim()}
                  onClick={() => void submitReply()}
                  className="h-11 shrink-0 bg-[#d7e8f7] px-4 text-slate-950 hover:bg-[#c6ddf2]"
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
                <p className="mt-3 pb-3 text-center text-sm text-rose-300">
                  {error}
                </p>
              ) : (
                <p className="mt-3 hidden pb-3 text-center text-sm text-white/65 sm:block">
                  Please Keep this conversation healthy
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
