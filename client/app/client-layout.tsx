"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AppHeader from "@/app/components/Header/app-header";
import AiAssistantLauncher from "@/app/components/ai-assistant-launcher";
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
  const [preferencesModalDismissed, setPreferencesModalDismissed] =
    useState(false);
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
  }, [
    authStatus,
    isAuthPage,
    isAuthResolving,
    isLandingPage,
    isProtectedHomePage,
    router,
    userId,
  ]);

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
      {isSessionSensitiveRoute && isAuthResolving ? (
        <main className="flex h-screen items-center justify-center bg-[#0c0c0e]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-cyan-400" />
              <div className="absolute inset-0 rounded-full border border-white/0.06" />
            </div>

            <span className="animate-pulse text-[11px] uppercase tracking-widest text-white/30">
              Loading
            </span>
          </div>
        </main>
      ) : (
        children
      )}
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
