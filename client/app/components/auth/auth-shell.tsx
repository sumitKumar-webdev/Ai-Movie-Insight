"use client";

import type { ReactNode } from "react";
import { PosterRail } from "../poster rail/poster-rail";

const leftPosters = [
  "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  "https://image.tmdb.org/t/p/w500/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg", 
  "https://image.tmdb.org/t/p/w500/4q2hz2m8hubgvijz8Ez0T2Os2Yv.jpg",
  "https://image.tmdb.org/t/p/w500/k7eYdWvhYQyRQoU2TB2A2Xu2TfD.jpg", 
  "https://image.tmdb.org/t/p/w500/6bCplVkhowCjTHXWv49UjRPn0eK.jpg", 
];

const centerPosters = [
  "https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
  "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
  "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
  "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
  "https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg",
];

const rightPosters = [
  "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", 
  "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", 
  "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", 
  "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", 
  "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
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
