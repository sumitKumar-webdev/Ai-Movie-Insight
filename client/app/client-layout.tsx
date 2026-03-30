"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
    if ((isAuthPage || isProtectedHomePage) && authStatus === "idle") {
      void fetchCurrentUser();
    }
  }, [authStatus, isAuthPage, isProtectedHomePage]);

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

  if ((isAuthPage || isProtectedHomePage) && isAuthResolving) {
    return null;
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
