"use client";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import CompactCount, { formatCompactCount } from "@/app/components/ui/compact-count";
import { cn } from "@/lib/utils";
import { Review } from "@/app/models/service.modal";
import ExpandableText from "../ExpandableText/ExpandableText";
import RenderAvatar from "../avatar/render-avatar";
import ActionButton, { ActionItem } from "@/app/components/actions/action-menu";
import { HandleAction } from "@/app/models/action.model";
import VerifiedBadge from "../verified-badge";
import { getProfileHref } from "@/lib/profile";

type ReviewCardProps = {
  review: Review;
  isOwnReview?: boolean;
  menuLabel?: string;
  menuActions?: ActionItem[];
  likeAction?: ActionItem | null;
  repliesAction?: ActionItem | null;
  replyCountAction?: ActionItem | null;
  handleAction?: HandleAction<Record<string, unknown> | string>;
  className?: string;
};

export default function ReviewCard({
  review,
  isOwnReview = false,
  menuLabel = "Open review actions",
  menuActions,
  likeAction,
  repliesAction,
  replyCountAction,
  handleAction,
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
    typeof review.commentCount === "number"
      ? review.commentCount
      : Array.isArray(review.replies)
        ? review.replies.length
        : 0;
  const resolvedMenuActions = menuActions ?? [];
  const replyCountLabel = formatCompactCount(totalReplies);
  const normalizedUsername = review.user?.username?.trim() ?? "";
  const profileHref = getProfileHref(normalizedUsername);
  const canOpenProfile = Boolean(normalizedUsername);

  const triggerAction = (item?: ActionItem | null) => {
    if (!item) return;

    if (item.onSelect) {
      void item.onSelect();
      return;
    }

    if (item.action) {
      void handleAction?.(
        item.action,
        item.actionValue,
        review,
        item.actionUse,
      );
    }
  };

  return (
    <Card
      className={cn(
        "w-full border-0 border-b py-2 px-3 border-[#252833] bg-transparent text-white shadow-none rounded-none",
        isOwnReview && "border-cyan-400 border-b-2 bg-white/5 rounded-lg",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-5 px-0 py-5">
        <div className="flex w-full items-center justify-between gap-4">
          {canOpenProfile ? (
            <Link
              href={profileHref}
              className="flex max-w-[75%] items-center gap-3 transition hover:opacity-90"
            >
              <RenderAvatar
                name={review.user?.username ?? review.user?.name ?? "User"}
                imageUrl={review.user?.imageUrl}
              />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5 text-sm text-[#E2E2E2] md:text-base">
                  <p className="truncate font-semibold hover:text-white">
                    {review.user?.username ?? review.user?.name}
                  </p>
                  {review.user?.isVerified && (
                    <VerifiedBadge className="h-4 w-4 shrink-0" />
                  )}
                </div>
                <div className="flex items-center text-xs text-[#C6C6C6]">
                  <span className="truncate">{reviewDate}</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex max-w-[75%] items-center gap-3">
              <RenderAvatar
                name={review.user?.username ?? review.user?.name ?? "User"}
                imageUrl={review.user?.imageUrl}
              />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5 text-sm text-[#E2E2E2] md:text-base">
                  <p className="truncate font-semibold transition-colors duration-200 text-white/40 hover:text-white">
                    {review.user?.username ?? review.user?.name}
                  </p>
                  {review.user?.isVerified && (
                    <VerifiedBadge className="h-4 w-4 shrink-0" />
                  )}
                </div>
                <div className="flex items-center text-xs text-[#C6C6C6]">
                  <span className="truncate">{reviewDate}</span>
                </div>
              </div>
            </div>
          )}

          <ActionButton
            config={resolvedMenuActions}
            row={review}
            menuLabel={menuLabel}
            handleAction={handleAction}
          />
        </div>

        <div className="relative">
          <ExpandableText limit={200} text={review.text} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => triggerAction(likeAction)}
              className="flex items-center -ml-2 p-2 text-[#f5f5f5] transition-transform duration-100 active:scale-95"
            >
              <Heart
                className={cn(
                  "h-6 w-6",
                  review.likedByUser
                    ? "fill-[#ed4956] stroke-[#ed4956] text-[#ed4956]"
                    : "fill-none stroke-[#f5f5f5] text-[#f5f5f5]",
                )}
                strokeWidth={1.5}
              />
              <CompactCount
                value={review.likeCount}
                className="ml-1 min-w-5 text-sm font-normal text-[#f5f5f5]"
              />
            </button>

            <button
              type="button"
              onClick={() => triggerAction(repliesAction)}
              className="flex items-center -ml-2 p-2 text-[#f5f5f5] transition-transform duration-100 active:scale-95"
            >
              <MessageCircle
                className="h-6 w-6 fill-none stroke-[#f5f5f5] text-[#f5f5f5]"
                strokeWidth={1.5}
              />
              <CompactCount
                value={totalReplies}
                className="ml-1 min-w-5 text-sm font-normal text-[#f5f5f5]"
              />
            </button>
          </div>

          {Boolean(totalReplies) && (
            <button
              type="button"
              onClick={() => triggerAction(replyCountAction ?? repliesAction)}
              className="cursor-pointer"
            >
              <span className="reply-count-shimmer text-sm font-semibold">
                {replyCountLabel} {totalReplies === 1 ? "reply" : "replies"}
              </span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
