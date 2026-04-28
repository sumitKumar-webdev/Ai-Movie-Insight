"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Edit, Film, PencilLine, ShieldCheck } from "lucide-react";
import RenderAvatar from "@/app/components/avatar/render-avatar";
import { Skeleton } from "@/app/components/ui/skeleton";
import VerifiedBadge from "@/app/components/verified-badge";
import { AuthUser, PublicProfileUser } from "@/app/store/auth-slice";

const sidebarPanelClassName =
  "rounded-[1.05rem] border border-white/10 bg-[#0a0a0a] shadow-[0_18px_44px_rgba(0,0,0,0.28)]";

type PreferenceSummaryItem = {
  key: string;
  label: string;
  items: string[];
};

function getPossessiveLabel(value: string) {
  return value.endsWith("s") ? `${value}'` : `${value}'s`;
}

type ProfileSidebarProps = {
  user: AuthUser | PublicProfileUser;
  isOwnProfile: boolean;
  providerLabel?: string;
  userReviewsCount: number | null;
  totalPreferenceCount?: number;
  preferenceSummary?: PreferenceSummaryItem[];
  onEditProfile?: () => void;
  onEditInterests?: () => void;
};

function PreferenceTagList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="rounded-[0.8rem] border border-white/8 bg-[linear-gradient(180deg,#101010,#0d0d0d)] p-4">
      <p className="text-[11px] font-medium tracking-[0.18em] text-cyan-100/42 uppercase">
        {label}
      </p>

      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${label}-${item}`}
              className="inline-flex rounded-md border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(26,26,26,0.95),rgba(17,17,17,0.95))] px-2.5 py-1 text-xs font-medium text-cyan-50/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/45">Nothing selected yet.</p>
      )}
    </div>
  );
}

export function ProfileSidebarSkeleton() {
  return (
    <aside className={`${sidebarPanelClassName} h-fit min-w-0 overflow-hidden`}>
      <div className="border-b border-white/8 bg-[#101010] p-4 sm:p-5">
        <div className="h-9" />
        <div className="mt-3 flex flex-col items-center text-center">
          <Skeleton className="h-20 w-20 rounded-full bg-white/10 sm:h-22 sm:w-22 md:h-29 md:w-29" />
          <div className="mt-4 flex items-center gap-2">
            <Skeleton className="h-7 w-32 bg-white/10 sm:h-8 sm:w-40" />
          </div>
          <Skeleton className="mt-2 h-4 w-24 bg-white/8" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-56 max-w-full bg-white/8" />
            <Skeleton className="h-4 w-56 max-w-full bg-white/8" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="rounded-[0.8rem] border border-white/8 bg-[#101010] p-4"
            >
              <Skeleton className="h-3 w-16 bg-white/8" />
              <Skeleton className="mt-3 h-8 w-12 bg-white/10" />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[0.8rem] border border-white/8 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md bg-white/8" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 bg-white/8" />
              <Skeleton className="h-4 w-32 bg-white/10" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full bg-white/8" />
            <Skeleton className="h-4 w-11/12 bg-white/8" />
          </div>

          <div className="mt-4 space-y-3">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-md border border-white/8 bg-black/18 px-3 py-2"
              >
                <Skeleton className="h-3 w-16 bg-white/8" />
                <Skeleton className="mt-2 h-4 w-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Skeleton className="h-10 rounded-md bg-white/8" />
          <Skeleton className="h-10 rounded-md bg-white/8" />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-sm bg-white/8" />
              <Skeleton className="h-4 w-28 bg-white/10" />
            </div>
            <Skeleton className="h-4 w-4 rounded-sm bg-white/8" />
          </div>

          <div className="mt-4 grid gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-[0.8rem] border border-white/8 bg-[linear-gradient(180deg,#101010,#0d0d0d)] p-4"
              >
                <Skeleton className="h-3 w-24 bg-white/8" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3].map((chip) => (
                    <Skeleton
                      key={chip}
                      className="h-7 w-18 rounded-md bg-white/8"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function ProfileSidebar({
  user,
  isOwnProfile,
  providerLabel,
  userReviewsCount,
  totalPreferenceCount = 0,
  preferenceSummary = [],
  onEditProfile,
  onEditInterests,
}: ProfileSidebarProps) {
  const [isTasteProfileOpen, setIsTasteProfileOpen] = useState(false);
  const hasUserReviewsCount = typeof userReviewsCount === "number";
  const displayName = user.name || user.username || "User";
  const privateUser = isOwnProfile && "email" in user ? user : null;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const applyExpandedState = (matches: boolean) => {
      setIsTasteProfileOpen(matches);
    };

    applyExpandedState(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyExpandedState(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <aside className={`${sidebarPanelClassName} h-fit min-w-0 overflow-hidden`}>
      <div className="border-b border-white/8 bg-[#101010] p-4 sm:p-5">
        {isOwnProfile && onEditProfile ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onEditProfile}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#141414] text-white/70 transition hover:bg-[#181818] hover:text-white"
              aria-label="Open profile settings"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="flex flex-col items-center text-center">
          <RenderAvatar
            name={displayName}
            imageUrl={user.avatar}
            className="h-20 w-20 rounded-full border border-white/12 bg-white/8 sm:h-22 sm:w-22 md:h-29 md:w-29"
          />

          <div className="mt-4 flex min-w-0 max-w-full items-center justify-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {displayName}
            </h1>
            {user.isVerified ? (
              <VerifiedBadge className="h-5 w-5 shrink-0" />
            ) : null}
          </div>

          <p className="mt-1 max-w-full truncate text-sm text-white/62">
            @{user.username}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/56">
            {isOwnProfile
              ? "Your review archive and taste profile, styled to match the rest of CineAI."
              : `${getPossessiveLabel(displayName)} public review archive on CineAI.`}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[0.8rem] border border-white/8 bg-[#101010] p-4">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-white/40 uppercase">
              Reviews
            </p>
            {hasUserReviewsCount ? (
              <p className="mt-2 text-2xl font-semibold text-white">
                {userReviewsCount}
              </p>
            ) : (
              <Skeleton className="mt-2 h-8 w-12 bg-white/10" />
            )}
          </div>
          <div className="rounded-[0.8rem] border border-white/8 bg-[#101010] p-4">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-white/40 uppercase">
              {isOwnProfile ? "Taste" : "Status"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {isOwnProfile ? totalPreferenceCount : user.isVerified ? "Verified" : "Public"}
            </p>
          </div>
        </div>

        {isOwnProfile ? (
          <div className="mt-6 rounded-[0.8rem] border border-white/8 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-cyan-400/16 bg-cyan-400/10">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-cyan-100/55 uppercase">
                  Account
                </p>
                <p className="mt-0.5 text-sm font-medium text-white/88">
                  {privateUser?.emailVerified ? "Verified access" : "Verification pending"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/62">
              {privateUser?.emailVerified
                ? "Your account is verified and ready for sign-in recovery."
                : "Email verification is still pending for this account."}
            </p>

            <div className="mt-4 space-y-3 text-sm text-white/60">
              <div className="rounded-md border border-white/8 bg-black/18 px-3 py-2">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-cyan-100/45 uppercase">
                  Provider
                </p>
                <p className="mt-1 text-white/74">{providerLabel ?? "Email"}</p>
              </div>
              <div className="rounded-md border border-white/8 bg-black/18 px-3 py-2">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-cyan-100/45 uppercase">
                  Email
                </p>
                <p className="mt-1 break-all text-white/74">{privateUser?.email ?? ""}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className={`mt-4 grid gap-3 ${isOwnProfile ? "sm:grid-cols-2 lg:grid-cols-1" : ""}`}>
          {isOwnProfile && onEditInterests ? (
            <button
              type="button"
              onClick={onEditInterests}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-[#141414] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#191919]"
            >
              <PencilLine className="h-4 w-4" />
              Edit interests
            </button>
          ) : null}
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-[#141414] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#191919]"
          >
            Discover movies
          </Link>
        </div>

        {isOwnProfile ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsTasteProfileOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left transition duration-300"
              aria-expanded={isTasteProfileOpen}
              aria-controls="profile-taste-profile"
            >
              <div className="flex items-center gap-3">
                <Film className="h-4 w-4 text-white/60" />
                <h2 className="text-sm font-semibold tracking-[0.12em] text-white uppercase">
                  Taste profile
                </h2>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-white/55 transition-transform duration-300 ease-out ${
                  isTasteProfileOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            <div
              id="profile-taste-profile"
              className={`grid transition-all duration-500 ease-out ${
                isTasteProfileOpen
                  ? "mt-4 grid-rows-[1fr] opacity-100"
                  : "mt-3 grid-rows-[0fr] opacity-70"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="grid gap-3">
                  {preferenceSummary.map((group) => (
                    <PreferenceTagList
                      key={group.key}
                      label={group.label}
                      items={group.items}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
