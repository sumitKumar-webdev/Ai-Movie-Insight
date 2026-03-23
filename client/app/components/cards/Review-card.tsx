"use client";
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
import { formatLabel } from "@/lib/resuable-component";
import { Review } from "@/app/modal/service.modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import ExpandableText from "../ExpandableText/ExpandableText";
import RenderAvatar from "../avatar/render-avatar";

type ReviewCardProps = {
  review: Review;
  isOwnReview?: boolean;
  highlightAsOwner?: boolean;
  menuLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onLike?: () => void;
  onOpenReplies?: () => void;
  className?: string;
};

export default function ReviewCard({
  review,
  isOwnReview = false,
  highlightAsOwner = false,
  menuLabel = "Open review actions",
  onEdit,
  onDelete,
  onReport,
  onLike,
  onOpenReplies,
  className,
}: ReviewCardProps) {

  const reviewDate = review.date
    ? new Date(review.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const totalReplies =
    typeof review.replyCount === "number"
      ? review.replyCount
      : Array.isArray(review.replies)
        ? review.replies.length
        : 0;
  const canEdit = isOwnReview && Boolean(onEdit);
  const canDelete = isOwnReview && Boolean(onDelete);
  const canReport = !isOwnReview && Boolean(onReport);
  const showMenu = canEdit || canDelete || canReport;
  const reviewText = typeof review.text === "string" ? review.text.trim() : "";

  return (
    <Card
      className={cn(
        "w-full border-0 border-b border-[#252833] bg-transparent text-white shadow-none rounded-none",
        highlightAsOwner && "border-b-cyan-400/30",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-5 px-0 py-5">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex max-w-[75%] items-center gap-3">
            <RenderAvatar name={review.author} imageUrl={review.imageUrl} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5 text-sm text-[#E2E2E2] md:text-base">
                <p className="truncate font-semibold hover:text-white">
                  {review.username}
                </p>
              </div>
              <div className="flex items-center text-xs text-[#C6C6C6]">
                <span className="truncate">{reviewDate}</span>
              </div>
            </div>
          </div>

          {showMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={menuLabel}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                >
                  <EllipsisVertical className="h-5 w-5 text-[#C6C6C6]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {canEdit ? (
                  <DropdownMenuItem
                    onSelect={() => onEdit?.()}
                    className="gap-2"
                  >
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
                  <DropdownMenuItem
                    onSelect={() => onReport?.()}
                    className="gap-2"
                  >
                    <Flag className="h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="h-8 w-8 shrink-0" />
          )}
        </div>

        <div className="relative">
          <ExpandableText limit={350} text={reviewText} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLike}
              className="flex items-center -ml-2 p-2 text-[#f5f5f5] transition-transform duration-100 active:scale-95"
            >
              <Heart
                className={cn(
                  "h-6 w-6",
                  review.liked
                    ? "fill-[#ed4956] stroke-[#ed4956] text-[#ed4956]"
                    : "fill-none stroke-[#f5f5f5] text-[#f5f5f5]",
                )}
                strokeWidth={1.5}
              />
              {Boolean(review.likes) && (
                <span className="ml-1 min-w-5 text-sm font-normal text-[#f5f5f5]">
                  {review.likes}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenReplies}
              className="flex items-center -ml-2 p-2 text-[#f5f5f5] transition-transform duration-100 active:scale-95"
            >
              <MessageCircle
                className="h-6 w-6 fill-none stroke-[#f5f5f5] text-[#f5f5f5]"
                strokeWidth={1.5}
              />
              {totalReplies ? (
                <span className="ml-1 min-w-5 text-sm font-normal text-[#f5f5f5]">
                  {totalReplies}
                </span>
              ) : null}
            </button>
          </div>

          {Boolean(totalReplies) && (
            <button onClick={onOpenReplies} className="cursor-pointer">
              <span className="reply-count-shimmer text-sm text-bold">
                {totalReplies} {totalReplies === 1 ? "reply" : "replies"}
              </span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
