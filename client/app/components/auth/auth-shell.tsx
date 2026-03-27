"use client";

import type { ReactNode } from "react";
import { PosterRail } from "../poster rail/poster-rail";

const leftPosters = [
  "https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg",
  "https://image.tmdb.org/t/p/w500/2TeJfUZMGolfDdW6DKhfIWqvq8y.jpg",
  "https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg",
  "https://image.tmdb.org/t/p/w500/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg",
  "https://image.tmdb.org/t/p/w500/uS1AIL7I1Ycgs8PTfqUeN6jYNsQ.jpg",
  'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
];

const centerPosters = [
  "https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
  "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w500/5weKu49pzJCt06OPpjvT80efnQj.jpg",
  "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
  "https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
];

const rightPosters = [
  "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", 
  "https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg", 
  "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", 
  "https://image.tmdb.org/t/p/w500/k68nPLbIST6NP96JmTxmZijEvCA.jpg", 
  "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w500/pgqgaUx1cJb5oZQQ5v0tNARCeBp.jpg",
];
type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative overflow-hidden bg-black text-white">
      {/* <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#090909_0%,#040404_42%,#000000_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full bg-[radial-gradient(circle_at_top,rgba(110,168,254,0.22),rgba(110,168,254,0.08)_38%,transparent_48%)]" /> */}

      <section className="relative mx-auto flex min-h-screen items-center justify-center">
        <div className="hidden shrink-0 items-center justify-center gap-5 lg:flex">
          <PosterRail posters={leftPosters} />
          <PosterRail posters={centerPosters} reverse />
          <PosterRail posters={rightPosters} />
        </div>

        <div className="w-full lg:ml-10 lg:max-w-md">
          <div className="auth-card-enter mx-auto w-full max-w-sm rounded-[28px] border border-white/14 bg-white/95 p-5 text-slate-900 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:max-w-md sm:p-6">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                {badge}
              </span>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {title}
                </h1>
                <p className="text-sm leading-5 text-slate-600">
                  {description}
                </p>
              </div>
            </div>

            {children}

            {footer ? (
              <div className="mt-6 text-sm text-slate-600">{footer}</div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
