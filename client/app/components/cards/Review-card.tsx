"use client";

import { useState } from "react";
import {
  EllipsisVertical,
  Flag,
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";
import { formatLabel, getInitials } from "@/lib/resuable-component";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ReviewReply } from "@/app/modal/service.modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

type ReviewCardProps = {
  reviewId?: string;
  name: string;
  imageUrl?: string | null;
  reviewDate: string;
  review?: string | null;
  likes?: number;
  replies?: ReviewReply[];
  isOwnReview?: boolean;
  highlightAsOwner?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canReport?: boolean;
  ownerLabel?: string;
  menuLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onLike?: () => void;
  onReply?: (message: string) => Promise<void> | void;
  className?: string;
};

export default function ReviewCard({
  reviewId,
  name,
  imageUrl,
  reviewDate,
  review,
  likes = 0,
  replies = [],
  isOwnReview = false,
  highlightAsOwner = false,
  canEdit = false,
  canDelete = false,
  canReport = false,
  ownerLabel = "Your review",
  menuLabel = "Open review actions",
  onEdit,
  onDelete,
  onReport,
  onLike,
  onReply,
  className,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [replying, setReplying] = useState(false);
  const reviewText = typeof review === "string" ? review.trim() : "";
  const visibleReplies = replies.filter(
    (reply) => typeof reply?.text === "string" && reply.text.trim(),
  );
  const canToggle = reviewText.length > 160;

  const submitReply = async () => {
    const message = replyInput.trim();
    if (!message || !onReply) return;

    try {
      setReplying(true);
      await onReply(message);
      setReplyInput("");
      setShowReplies(true);
    } finally {
      setReplying(false);
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-white/10 bg-white/4 text-white",
        "backdrop-blur-md transition",
        "hover:border-white/20 hover:bg-white/5",
        "focus-within:border-white/20",
        highlightAsOwner && "border-white/20 bg-white/6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          {imageUrl ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 sm:h-11 sm:w-11">
              <Image
                src={imageUrl || ""}
                alt={`${name}'s avatar`}
                fill
                sizes="(max-width: 640px) 40px, 44px"
                className="object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 sm:h-11 sm:w-11">
              <span className="text-xs font-semibold tracking-wide text-white/90 sm:text-sm">
                {getInitials(name)}
              </span>
              <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/10 to-transparent" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-x-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white sm:text-[15px]">
                    {formatLabel(name)}
                  </p>
                  {isOwnReview ? (
                    <span className="rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
                      {ownerLabel}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-white/60 sm:text-xs">
                  {reviewDate}
                </p>
              </div>

              {(canEdit || canDelete || canReport) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={menuLabel}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                    >
                      <EllipsisVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {canEdit ? (
                      <DropdownMenuItem onSelect={() => onEdit?.()} className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    ) : null}
                    {canDelete ? (
                      <DropdownMenuItem
                        onSelect={() => onDelete?.()}
                        variant="destructive"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    ) : null}
                    {canReport ? (
                      <DropdownMenuItem onSelect={() => onReport?.()} className="gap-2">
                        <Flag className="h-4 w-4" />
                        Report
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="mt-2">
              <p
                className={cn(
                  "text-sm leading-6 text-white/85 sm:leading-7",
                  !expanded &&
                    "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden",
                  "transition-[max-height,opacity] duration-300 ease-out",
                )}
              >
                {reviewText || "No review text provided."}
              </p>

              {canToggle ? (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className={cn(
                    "mt-2 inline-flex items-center rounded-md text-xs font-medium",
                    "text-violet-300 hover:text-violet-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
                  )}
                  aria-expanded={expanded}
                >
                  {expanded ? "View less" : "View more"}
                  <span className="ml-1 opacity-70 transition group-hover:opacity-100">
                    {expanded ? "?" : "?"}
                  </span>
                </button>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onLike}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <Heart className="h-4 w-4" />
                  {likes}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplies((value) => !value)}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4" />
                  Reply
                </Button>
                {visibleReplies.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowReplies((value) => !value)}
                    className="text-xs font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
                  >
                    {showReplies ? "Hide replies" : `View replies (${visibleReplies.length})`}
                  </button>
                ) : null}
              </div>

              {showReplies ? (
                <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  {onReply ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={replyInput}
                        onChange={(event) => setReplyInput(event.target.value)}
                        placeholder="Write a reply..."
                        className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={replying || !replyInput.trim()}
                        onClick={submitReply}
                        className="bg-white text-black hover:bg-white/90"
                      >
                        {replying ? "Replying..." : "Reply"}
                      </Button>
                    </div>
                  ) : null}

                  {visibleReplies.length > 0 ? (
                    <div className="space-y-2">
                      {visibleReplies.map((reply) => (
                        <div
                          key={reply._id ?? `${reviewId}-${reply.date}`}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">
                              {formatLabel(reply.author)}
                            </p>
                            <p className="text-[11px] text-white/55">
                              {reply.date ? new Date(reply.date).toLocaleDateString() : ""}
                            </p>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-white/80">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">No replies yet.</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
