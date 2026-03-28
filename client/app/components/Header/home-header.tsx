"use client";

import Link from "next/link";
import BrandWordmark from "@/app/components/brand/wordmark";
import HeaderProfileMenu from "@/app/components/Header/header-profile-menu";

export default function HomeHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 min-w-screen">
      <div className="relative flex w-full px-2 md:px-5 md:pr-10 py-1 items-center justify-between">

        <Link
          href="/"
          className="pointer-events-auto relative z-10 inline-flex items-center rounded-xl px-2 py-1 text-white/92 transition hover:text-white"
        >
          <BrandWordmark compact titleClassName="text-md" subtitleClassName="text-[0.35rem] tracking-[0.24em] sm:text-[0.54rem]"/>
        </Link>

        <div className="pointer-events-auto relative z-10">
          <HeaderProfileMenu
            triggerClassName="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            avatarClassName="h-8 w-8 md:h-9 md:w-9"
            menuClassName="z-60 w-44"
          />
        </div>
      </div>
    </header>
  );
}
