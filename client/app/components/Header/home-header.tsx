"use client";

import Link from "next/link";
import BrandWordmark from "@/app/components/brand/wordmark";
import HeaderProfileMenu from "@/app/components/Header/header-profile-menu";

export default function HomeHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 min-w-screen">
      <div className="relative flex w-full items-center justify-between px-2 py-0.5 md:px-5 md:py-1 md:pr-10">

        <Link
          href="/"
          className="pointer-events-auto relative z-10 inline-flex items-center rounded-xl px-2 py-1 text-white/92 transition hover:text-white"
        >
          <BrandWordmark compact titleClassName="text-md" subtitleClassName="text-[0.55rem] tracking-[0.24em] sm:text-[0.75rem]"/>
        </Link>

        <div className="pointer-events-auto relative z-10">
          <HeaderProfileMenu
            triggerClassName="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 md:h-10 md:w-10"
            avatarClassName="h-8 w-8 md:h-9 md:w-9"
            menuClassName="z-60 w-44"
          />
        </div>
      </div>
    </header>
  );
}
