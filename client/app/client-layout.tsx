"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/app/components/Header/app-header";
import AiAssistantLauncher from "@/app/components/ai-assistant-launcher";

type ClientLayoutProps = {
  children: React.ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth/");
  const isHomePage = pathname === "/";

  return (
    <>
      {!isAuthPage && !isHomePage && <AppHeader />}
      {children}
      {!isAuthPage && <AiAssistantLauncher />}
    </>
  );
}
