"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/app/components/Header/app-header";
import AiAssistantLauncher from "@/app/components/ai-assistant-launcher";
import BrandWordmark from "@/app/components/brand/wordmark";
import { fetchCurrentUser, useAuthStore } from "@/app/store/store";
import HomeHeader from "./components/Header/home-header";
import UserPreferencesModal from "./modal/user-preferences-modal";

type ClientLayoutProps = {
  children: React.ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth/");
  const isLandingPage = pathname === "/";
  const isHomePage = pathname === "/";
  const isProtectedHomePage = pathname === "/home";
  const isSessionSensitiveRoute =
    isAuthPage || isLandingPage || isProtectedHomePage;
  const authStatus = useAuthStore((auth) => auth.status);
  const user = useAuthStore((auth) => auth.user);
  const userId = user?.id;
  const [preferencesModalDismissed, setPreferencesModalDismissed] = useState(false);
  const isAuthResolving = authStatus === "idle" || authStatus === "loading";
  const shouldShowPreferencesModal =
    !isAuthPage &&
    authStatus === "authenticated" &&
    Boolean(userId) &&
    !user?.preferences?.onboardingCompleted &&
    !preferencesModalDismissed;

  useEffect(() => {
    if (isSessionSensitiveRoute && authStatus === "idle") {
      void fetchCurrentUser();
    }
  }, [authStatus, isSessionSensitiveRoute]);

  useEffect(() => {
    if (isAuthResolving) {
      return;
    }

    if (isAuthPage && authStatus === "authenticated" && userId) {
      router.replace("/home");
      return;
    }

    if (isLandingPage && authStatus === "authenticated" && userId) {
      router.replace("/home");
      return;
    }

    if (isProtectedHomePage && authStatus === "unauthenticated") {
      router.replace("/auth/login?next=/home");
    }
  }, [authStatus, isAuthPage, isAuthResolving, isLandingPage, isProtectedHomePage, router, userId]);

  if (isSessionSensitiveRoute && isAuthResolving) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_75%_25%,rgba(94,216,255,0.16),transparent_24%),linear-gradient(to_bottom,#040404,#090d16)]" />
        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          <BrandWordmark
            className="items-center"
            titleClassName="text-4xl sm:text-5xl"
            subtitleClassName="text-[0.55rem] tracking-[0.28em] text-white/70"
          />
          <div className="mt-6 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[linear-gradient(90deg,#5ed8ff_0%,#1698ff_100%)]" />
          </div>
          <p className="mt-4 text-sm text-white/62">
            Restoring your CineAI session...
          </p>
        </div>
      </main>
    );
  }

  if (isAuthPage && authStatus === "authenticated" && userId) {
    return null;
  }

  if (isLandingPage && authStatus === "authenticated" && userId) {
    return null;
  }

  if (isProtectedHomePage && authStatus === "unauthenticated") {
    return null;
  }

  return (
    <>
      {!isAuthPage && !isHomePage && <AppHeader />}
      {!isAuthPage && isHomePage && <HomeHeader />}
      {children}
      {!isAuthPage && <AiAssistantLauncher />}
      <UserPreferencesModal
        open={shouldShowPreferencesModal}
        onOpenChange={(open) => {
          if (!open) {
            setPreferencesModalDismissed(true);
          }
        }}
      />
    </>
  );
}
