"use client";

import { PublicProfileUser } from "@/app/store/auth-slice";
import RenderAvatar from "@/app/components/avatar/render-avatar";
import VerifiedBadge from "@/app/components/verified-badge";

type CompactUserCardProps = {
  user: PublicProfileUser;
  onClick?: () => void;
};

export default function CompactUserCard({
  user,
  onClick,
}: CompactUserCardProps) {
  const displayName = user.name?.trim() || user.username?.trim() || "User";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[1.15rem] border border-white/8 bg-[#101010] px-3 py-3 text-left transition hover:border-white/14 hover:bg-[#171717]"
    >
      <RenderAvatar
        name={displayName}
        imageUrl={user.avatar}
        className="h-11 w-11 shrink-0"
        initialsClassName="text-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          {user.isVerified ? <VerifiedBadge className="h-4 w-4 shrink-0" /> : null}
        </div>
        <p className="mt-1 truncate text-xs text-white/55">@{user.username}</p>
      </div>
    </button>
  );
}
