"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/app/components/Header/app-header";
import HomeHeader from "./components/Header/home-header";
import AiAssistantLauncher from "@/app/components/ai-assistant-launcher";
import UserPreferencesModal from "./modal/user-preferences-modal";
import { toast } from "@/app/Hooks/use-toast";
import { fetchCurrentUser, useAuthStore } from "@/app/store/store";
import { useAuthSessionRefreshing } from "@/app/services/auth-session-state";

const SLOW_BOOT_SCREEN_TOAST_DELAY_MS = 6000;

function AppBootScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-cyan-400" />
          <div className="absolute inset-0 rounded-full border border-white/10" />
        </div>
        <span className="animate-pulse text-[11px] uppercase tracking-widest text-white/30">
          Loading
        </span>
      </div>
    </main>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const isRefreshingAuthSession = useAuthSessionRefreshing();

  const [preferencesModalDismissed, setPreferencesModalDismissed] =
    useState(false);
  const hasShownFreeTierLoadingToast = useRef(false);

  const isAuthPage = pathname?.startsWith("/auth/");
  const isLandingPage = pathname === "/";
  const isProtectedHomePage = pathname === "/home";
  const isSessionSensitiveRoute =
    isAuthPage || isLandingPage || isProtectedHomePage;

  const isAuthChecking = authStatus === "loading";
  const isAuthenticated = authStatus === "authenticated" && !!user?.id;

  const shouldShowPreferencesModal =
    !isAuthPage &&
    isAuthenticated &&
    !user?.preferences?.onboardingCompleted &&
    !preferencesModalDismissed;

  useEffect(() => {
    if (isSessionSensitiveRoute && authStatus === "idle") {
      fetchCurrentUser();
    }
  }, [authStatus, isSessionSensitiveRoute]);

  const shouldShowBootScreen =
    (isAuthPage && isAuthenticated) ||
    (isLandingPage && isAuthenticated) ||
    (isProtectedHomePage && isAuthChecking) ||
    (isProtectedHomePage && authStatus === "unauthenticated");

  const isBootScreenVisible =
    shouldShowBootScreen || (isSessionSensitiveRoute && isRefreshingAuthSession);

  useEffect(() => {
    if (!isBootScreenVisible || hasShownFreeTierLoadingToast.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      hasShownFreeTierLoadingToast.current = true;
      toast({
        title: "Waking up the server",
        description:
          "This app runs on a free tier, so the first load can take up to 40 seconds.",
        duration: 12000,
        variant: "warning",
      });
    }, SLOW_BOOT_SCREEN_TOAST_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isBootScreenVisible]);

  useEffect(() => {
    if (isAuthChecking) return;

    if ((isAuthPage || isLandingPage) && isAuthenticated) {
      router.replace("/home");
      return;
    }

    if (isProtectedHomePage && authStatus === "unauthenticated") {
      router.replace("/auth/login?next=/home");
    }
  }, [
    authStatus,
    isAuthPage,
    isLandingPage,
    isProtectedHomePage,
    isAuthChecking,
    isAuthenticated,
    router,
  ]);

  if (shouldShowBootScreen) {
    return <AppBootScreen />;
  }

  return (
    <>
      {!isAuthPage && (isLandingPage ? <HomeHeader /> : <AppHeader />)}

      {isSessionSensitiveRoute && isRefreshingAuthSession ? (
        <AppBootScreen />
      ) : (
        children
      )}

      {!isAuthPage && !isAuthChecking && !isRefreshingAuthSession && <AiAssistantLauncher />}

      <UserPreferencesModal
        open={shouldShowPreferencesModal}
        onOpenChange={(open) => {
          if (!open) setPreferencesModalDismissed(true);
        }}
      />
    </>
  );
}
