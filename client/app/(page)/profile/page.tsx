"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgePlus,
  BadgeCheck,
  CircleHelp,
  Film,
  Mail,
  PencilLine,
  ShieldCheck,
  Edit,
} from "lucide-react";
import RenderAvatar from "@/app/components/avatar/render-avatar";
import VerifiedBadge from "@/app/components/verified-badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import ProfileSettingsModal from "@/app/modal/profile-settings-modal";
import UserPreferencesModal from "@/app/modal/user-preferences-modal";
import { fetchCurrentUser, useAuthStore } from "@/app/store/store";

const panelClassName =
  "rounded-[1.5rem] border border-white/10 bg-[#0b1017]/88 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl";

function ProfileSkeleton() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_top_left,rgba(92,184,255,0.16),transparent_26%),linear-gradient(180deg,#030507,#07111a)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className={`${panelClassName} p-6 sm:p-8`}>
            <Skeleton className="h-3 w-20 bg-white/10" />
            <div className="mt-6 flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-3xl bg-white/10" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48 bg-white/10" />
                <Skeleton className="h-4 w-28 bg-white/8" />
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <Skeleton className="h-3 w-16 bg-white/10" />
                  <Skeleton className="mt-4 h-6 w-24 bg-white/8" />
                </div>
              ))}
            </div>
          </div>

          <div className={`${panelClassName} p-6`}>
            <Skeleton className="h-5 w-28 bg-white/10" />
            <Skeleton className="mt-5 h-4 w-24 bg-white/8" />
            <Skeleton className="mt-2 h-5 w-32 bg-white/8" />
            <Skeleton className="mt-5 h-4 w-28 bg-white/8" />
            <Skeleton className="mt-2 h-5 w-40 bg-white/8" />
            <Skeleton className="mt-5 h-4 w-20 bg-white/8" />
            <Skeleton className="mt-2 h-5 w-full bg-white/8" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {[1, 2].map((item) => (
            <div key={item} className={`${panelClassName} p-6`}>
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="mt-4 h-7 w-48 bg-white/8" />
              <Skeleton className="mt-3 h-4 w-full bg-white/8" />
              <Skeleton className="mt-2 h-4 w-3/4 bg-white/8" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

const preferenceGroups = [
  { key: "cinemas", label: "Industries" },
  { key: "languages", label: "Languages" },
  { key: "genres", label: "Genres" },
  { key: "moods", label: "Moods" },
  { key: "formats", label: "Formats" },
] as const;

function PreferenceTagList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/0.03 p-4">
      <p className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
        {label}
      </p>

      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${label}-${item}`}
              className="inline-flex rounded-full border border-cyan-300/14 bg-cyan-400/8 px-3 py-1.5 text-xs font-medium text-cyan-50"
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

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((auth) => auth.user);
  const status = useAuthStore((auth) => auth.status);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      void fetchCurrentUser();
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/auth/login?next=/profile");
    }
  }, [router, status]);

  const providerLabel = user?.authProvider?.length
    ? user.authProvider
        .map((provider) => provider.charAt(0).toUpperCase() + provider.slice(1))
        .join(", ")
    : "Email";

  const preferenceSummary = useMemo(
    () =>
      preferenceGroups.map((group) => ({
        ...group,
        items: Array.isArray(user?.preferences?.[group.key])
          ? user.preferences[group.key]
          : [],
      })),
    [user],
  );

  const totalPreferenceCount = preferenceSummary.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  if (status === "idle" || status === "loading") {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_top_left,rgba(92,184,255,0.16),transparent_26%),linear-gradient(180deg,#030507,#07111a)] px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className={`${panelClassName} overflow-hidden`}>
              <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(102,186,255,0.16),rgba(255,255,255,0.03))] px-6 py-5 sm:px-8">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">
                  Account Center
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Profile
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-white/62 sm:text-base">
                  Manage the identity connected to your CineAI session, recommendations, and assistant activity.
                </p>
              </div>

              <div className="relative p-6 sm:p-8">
                <button
                  type="button"
                  onClick={() => setProfileSettingsOpen(true)}
                  className="absolute inline-flex h-8 w-8 items-center justify-center rounded-full text-white/72 transition hover:text-white top-2 right-2"
                  aria-label="Open profile settings"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                      <RenderAvatar
                        name={user.name || user.username || "User"}
                        imageUrl={user.avatar}
                        className="h-20 w-20 rounded-[1.6rem] border border-white/12 bg-white/8 sm:h-24 sm:w-24"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/55">Signed in as</p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <h2 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                            {user.name || user.username}
                          </h2>
                          {user.isVerified ? (
                            <VerifiedBadge className="h-5 w-5 shrink-0" />
                          ) : null}
                        </div>
                        <p className="mt-2 truncate text-sm text-white/62 sm:text-base">
                          @{user.username}
                        </p>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                          Your CineAI profile keeps your account, assistant activity, and recommendations connected in one place.
                        </p>
                        <p className="mt-2 text-xs text-white/45">
                          Profile photo and extra profile customization will be included in coming versions.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
                        {providerLabel}
                      </span>
                      <span className="inline-flex rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
                        {user.emailVerified ? "Verified account" : "Verification pending"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 border-t border-white/8 pt-6 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                        Status
                      </p>
                      <p className="mt-3 text-lg font-semibold text-white">
                        {user.emailVerified ? "Verified" : "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                        Email
                      </p>
                      <p className="mt-3 break-all text-base text-white/88">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                        Account ID
                      </p>
                      <p className="mt-3 break-all text-base text-white/70">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className={`${panelClassName} p-6`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold">Security snapshot</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                    Email verification
                  </p>
                  <p className="mt-2 text-sm text-white/88">
                    {user.emailVerified
                      ? "Your email is verified and ready for account recovery."
                      : "Verification is still pending for this account."}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                    Sign-in method
                  </p>
                  <p className="mt-2 text-sm text-white/88">{providerLabel}</p>
                </div>

                <div>
                  <p className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                    User ID
                  </p>
                  <p className="mt-2 break-all text-sm text-white/70">{user.id}</p>
                </div>
              </div>
            </aside>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className={`${panelClassName} p-6`}>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold">Personal details</h2>
              </div>

              <div className="mt-6 grid gap-5">
                <div className="border-b border-white/8 pb-5">
                  <p className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                    Email
                  </p>
                  <p className="mt-2 break-all text-base text-white">{user.email}</p>
                </div>

                <div className="border-b border-white/8 pb-5">
                  <p className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                    Full name
                  </p>
                  <p className="mt-2 text-base text-white">{user.name}</p>
                </div>

                <div>
                  <p className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                    Username
                  </p>
                  <p className="mt-2 text-base text-white">@{user.username}</p>
                </div>
              </div>
            </section>

            <section className={`${panelClassName} p-6`}>
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold">Workspace actions</h2>
              </div>

              <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">
                Jump back into discovery, open the support desk, or continue using CineAI with the same account session.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-cyan-300/22 bg-cyan-400/10 px-4 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/16"
                >
                  Discover movies
                </Link>
                <Link
                  href="/support"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/6 px-4 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <CircleHelp className="h-4 w-4" />
                  Support
                </Link>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/12 bg-transparent px-4 text-sm font-medium text-white/82 transition hover:bg-white/6 hover:text-white"
                >
                  Home
                </Link>
              </div>
            </section>
          </section>

          <section className={`${panelClassName} overflow-hidden`}>
            <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(102,186,255,0.12),rgba(255,255,255,0.02))] px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Film className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-lg font-semibold">Your interests</h2>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
                    These are the signals CineAI uses to shape your home feed, new releases, and recommendations.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
                    {totalPreferenceCount > 0
                      ? `${totalPreferenceCount} preferences saved`
                      : "No preferences yet"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreferencesModalOpen(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/22 bg-cyan-400/10 px-4 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/16"
                  >
                    <PencilLine className="h-4 w-4" />
                    Edit interests
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {totalPreferenceCount > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {preferenceSummary.map((group) => (
                    <PreferenceTagList
                      key={group.key}
                      label={group.label}
                      items={group.items}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/12 bg-white/0.02 p-6 text-center">
                  <BadgePlus className="mx-auto h-8 w-8 text-cyan-300/80" />
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    Add your interests
                  </h3>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-white/60">
                    Save your favorite industries, languages, genres, moods, and formats so we can personalize the home page around your taste.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPreferencesModalOpen(true)}
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/22 bg-cyan-400/10 px-4 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/16"
                  >
                    <PencilLine className="h-4 w-4" />
                    Add interests
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <UserPreferencesModal
        open={preferencesModalOpen}
        onOpenChange={setPreferencesModalOpen}
      />
      <ProfileSettingsModal
        open={profileSettingsOpen}
        onOpenChange={setProfileSettingsOpen}
        user={user}
      />
    </>
  );
}
