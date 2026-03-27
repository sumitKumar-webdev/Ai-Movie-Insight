"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CircleHelp,
  Mail,
  ShieldCheck,
} from "lucide-react";
import RenderAvatar from "@/app/components/avatar/render-avatar";
import VerifiedBadge from "@/app/components/verified-badge";
import { Skeleton } from "@/app/components/ui/skeleton";
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

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((auth) => auth.user);
  const status = useAuthStore((auth) => auth.status);

  useEffect(() => {
    if (status === "idle") {
      void fetchCurrentUser();
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/auth/login?next=/profile");
    }
  }, [router, status]);

  if (status === "idle" || status === "loading") {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return null;
  }

  const providerLabel = user.authProvider?.length
    ? user.authProvider
        .map((provider) => provider.charAt(0).toUpperCase() + provider.slice(1))
        .join(", ")
    : "Email";

  return (
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

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <RenderAvatar
                  name={user.name || user.username || "User"}
                  imageUrl={user.avatar}
                  className="h-20 w-20 rounded-[1.6rem] border border-white/12 bg-white/8 sm:h-24 sm:w-24"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/55">Signed in as</p>
                  <div className="mt-1 flex items-center gap-2">
                    <h2 className="truncate text-2xl font-semibold sm:text-3xl">
                      {user.name}
                    </h2>
                    {user.isVerified ? (
                      <VerifiedBadge className="h-5 w-5 shrink-0" />
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-sm text-white/62 sm:text-base">
                    @{user.username}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                    Status
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {user.emailVerified ? "Verified" : "Pending"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                    Provider
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">{providerLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                    Account
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">Active</p>
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

              <div>
                <p className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                  Username
                </p>
                <p className="mt-2 text-base text-white">{user.username}</p>
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
      </div>
    </main>
  );
}
