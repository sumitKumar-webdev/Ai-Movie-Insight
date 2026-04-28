"use client";

import Link from "next/link";
import {
  EllipsisVertical,
  Flag,
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Review, ReviewReply } from "@/app/models/service.modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import CompactCount from "@/app/components/ui/compact-count";
import ExpandableText from "@/app/components/ExpandableText/ExpandableText";
import RenderAvatar from "@/app/components/avatar/render-avatar";
import { formatLabel } from "@/lib/resuable-component";
import { cn } from "@/lib/utils";
import VerifiedBadge from "@/app/components/verified-badge";
import { getProfileHref } from "@/lib/profile";

type ReviewThreadItemProps = {
  review: Review | ReviewReply;
  variant?: "review" | "reply";
  isOwnReview?: boolean;
  menuLabel?: string;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onLike?: () => void;
  onOpenReplies?: () => void;
};

function formatReviewDate(value?: string, format: "short" | "long" = "short") {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(format === "long" ? { year: "numeric" as const } : {}),
  });
}

function toHandle(value: string) {
  return `@${value.replace(/^@+/, "")}`;
}

export default function ReviewThreadItem({
  review,
  variant = "review",
  isOwnReview = false,
  menuLabel = "Open review actions",
  className,
  onEdit,
  onDelete,
  onReport,
  onLike,
  onOpenReplies,
}: ReviewThreadItemProps) {
  const isReply = variant === "reply";
  const imageUrl = review.user?.imageUrl ?? null;
  const liked = Boolean(review.likedByUser);
  const normalizedUsername =
    typeof review.user?.username === "string" ? review.user.username.trim() : "";
  const normalizedAuthor =
    typeof review.user?.name === "string" ? review.user.name.trim() : "";
  const formattedAuthor = normalizedAuthor ? formatLabel(normalizedAuthor) : "";
  const primaryLabel = isReply
    ? normalizedUsername || formattedAuthor
    : formattedAuthor || normalizedUsername;
  const secondaryLabel = isReply
    ? ""
    : normalizedUsername
      ? toHandle(normalizedUsername)
      : "";
  const profileHref = getProfileHref(normalizedUsername);
  const canOpenProfile = Boolean(normalizedUsername);
  const reviewText = typeof review.text === "string" ? review.text.trim() : "";
  const reviewDate = formatReviewDate(review.date, variant === "review" ? "long" : "short");
  const likes = review.likeCount ?? 0;
  const totalReplies =
    "commentCount" in review && typeof review.commentCount === "number"
      ? review.commentCount
      : "replies" in review && Array.isArray(review.replies)
        ? review.replies.length
        : 0;
  const canEdit = isOwnReview && Boolean(onEdit);
  const canDelete = isOwnReview && Boolean(onDelete);
  const canReport = !isOwnReview && Boolean(onReport);
  const showMenu = canEdit || canDelete || canReport;

  return (
    <article
      className={cn(
        "w-full text-white",
        isReply ? "flex flex-col gap-2" : "py-5",
        className,
      )}
    >
      {isReply ? (
        <div className="flex items-start gap-3">
          {canOpenProfile ? (
            <Link href={profileHref} className="shrink-0">
              <RenderAvatar
                name={review.user?.name || "User"}
                imageUrl={imageUrl}
                className="h-8 w-8"
                initialsClassName="text-xs"
              />
            </Link>
          ) : (
            <RenderAvatar
              name={review.user?.name || "User"}
              imageUrl={imageUrl}
              className="h-8 w-8"
              initialsClassName="text-xs"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center">
                  {canOpenProfile ? (
                    <Link
                      href={profileHref}
                      className="truncate text-sm font-semibold text-[#ffffff] transition hover:text-white/80"
                    >
                      {primaryLabel}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-semibold text-[#ffffff]">
                      {primaryLabel}
                    </p>
                  )}
                  {review.user?.isVerified ? <VerifiedBadge className="ml-1 h-3.5 w-3.5 shrink-0" /> : null}
                </div>

                <div className="mb-2 text-sm leading-4.25 wrap-break-words text-[#c6c6c6]">
                  <ExpandableText limit={350} text={reviewText} />
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[13px] font-normal text-[#919191]">
                    {reviewDate || "Just now"}
                  </span>
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#919191] transition-colors hover:text-white"
                  >
                    Reply
                  </button>
                </div>
              </div>

              <div className="mt-1 flex shrink-0 items-start gap-1">
                <button
                  type="button"
                  onClick={onLike}
                  className="inline-flex items-center justify-center p-1 text-[#919191] transition hover:text-white"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      liked
                        ? "fill-[#ed4956] stroke-[#ed4956] text-[#ed4956]"
                        : "fill-none stroke-current",
                    )}
                    strokeWidth={1.5}
                  />
                </button>
                <CompactCount
                  value={likes}
                  className="pt-1 text-xs font-normal leading-none text-[#919191]"
                />
                {showMenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={menuLabel}
                        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-white/45 transition hover:bg-white/8 hover:text-white"
                      >
                        <EllipsisVertical className="h-3.5 w-3.5" />
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
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {canOpenProfile ? (
            <Link href={profileHref} className="shrink-0">
              <RenderAvatar
                name={review.user?.name || "User"}
                imageUrl={imageUrl}
                className="h-14 w-14"
                initialsClassName="text-sm"
              />
            </Link>
          ) : (
            <RenderAvatar
              name={review.user?.name || "User"}
              imageUrl={imageUrl}
              className="h-14 w-14"
              initialsClassName="text-sm"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {canOpenProfile ? (
                  <Link
                    href={profileHref}
                    className="truncate text-lg font-semibold tracking-[-0.01em] text-white transition hover:text-white/80"
                  >
                    {primaryLabel}
                  </Link>
                ) : (
                  <p className="truncate text-lg font-semibold tracking-[-0.01em] text-white">
                    {primaryLabel}
                  </p>
                )}
                {review.user?.isVerified ? <VerifiedBadge className="ml-1 inline-block h-4 w-4 align-[-2px]" /> : null}

                {secondaryLabel ? (
                  canOpenProfile ? (
                    <Link
                      href={profileHref}
                      className="mt-0.5 block truncate text-sm text-white/60 transition hover:text-white/80"
                    >
                      {secondaryLabel}
                    </Link>
                  ) : (
                    <p className="mt-0.5 truncate text-sm text-white/60">
                      {secondaryLabel}
                    </p>
                  )
                ) : null}
              </div>

              <div className="flex items-start gap-2">
                {onOpenReplies ? (
                  <button
                    type="button"
                    onClick={onOpenReplies}
                    className="hidden rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400 md:inline-flex"
                  >
                    Reply
                  </button>
                ) : null}

                {showMenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={menuLabel}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/8 hover:text-white"
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
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-base leading-7 font-medium text-[#e2e2e2]">
                <ExpandableText limit={350} text={reviewText} />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-7 text-[#f5f5f5]">
                <button
                  type="button"
                  onClick={onLike}
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <Heart
                    className={cn(
                      "h-7 w-7",
                      liked
                        ? "fill-[#ed4956] stroke-[#ed4956] text-[#ed4956]"
                        : "fill-none stroke-current",
                    )}
                    strokeWidth={1.8}
                  />
                  <CompactCount value={likes} className="text-sm font-normal" />
                </button>

                {onOpenReplies ? (
                  <button
                    type="button"
                    onClick={onOpenReplies}
                    className="inline-flex items-center gap-2 transition hover:text-white"
                  >
                    <MessageCircle className="h-7 w-7" strokeWidth={1.8} />
                    <CompactCount
                      value={totalReplies}
                      className="text-sm font-normal"
                    />
                  </button>
                ) : null}
              </div>

              {reviewDate ? (
                <p className="mt-5 text-sm text-[#a0a0a0]">{reviewDate}</p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </article>
  );
}
