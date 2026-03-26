"use client";

import Link from "next/link";
import { ArrowUpRight, Github, Mail, MessageSquareQuote, Sparkles } from "lucide-react";

const blockClassName =
  "rounded-[1.5rem] border border-white/10 bg-[#0b1017]/88 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl";

export default function SupportPage() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_top_right,rgba(104,191,255,0.15),transparent_24%),linear-gradient(180deg,#020406,#091019)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className={`${blockClassName} overflow-hidden p-0`}>
            <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(99,184,255,0.16),rgba(255,255,255,0.03))] px-6 py-5 sm:px-8">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">
                Support Desk
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Build in progress, feedback welcome
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
                CineAI is still evolving. The product direction is active, the interface will continue improving, and new features will keep landing over time.
              </p>
            </div>

            <div className="grid gap-5 px-6 py-6 sm:px-8 sm:py-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                    Project stage
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">Ongoing</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                    Focus
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">Polish + features</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                    Best input
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">Real feedback</p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                <div className="rounded-[1.3rem] border border-white/8 bg-white/4 p-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-lg font-semibold">What to expect next</h2>
                  </div>
                  <div className="mt-5 space-y-4 text-sm leading-7 text-white/72 sm:text-base">
                    <p>
                      The current goal is to keep sharpening the browsing experience, assistant interactions, and the general UI feel so the app becomes more useful and more polished over time.
                    </p>
                    <p>
                      If something feels confusing, rough, or incomplete, that kind of feedback is especially valuable while the product is still actively being shaped.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(68,163,255,0.1),rgba(255,255,255,0.02))] p-5">
                  <div className="flex items-center gap-3">
                    <MessageSquareQuote className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-lg font-semibold">Best ways to help</h2>
                  </div>
                  <ul className="mt-5 space-y-3 text-sm text-white/76 sm:text-base">
                    <li>Share bug reports with a short description of what happened.</li>
                    <li>Send UI suggestions when something feels awkward or unclear.</li>
                    <li>Reach out with feature ideas that would improve movie discovery.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <section className={blockClassName}>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold">Email contact</h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/65">
                For support, feedback, or collaboration, email directly and include a short note about what you need help with.
              </p>
              <a
                href="mailto:sumitkr8178@gmail.com"
                className="mt-5 inline-flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <span className="truncate">sumitkr8178@gmail.com</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </a>
            </section>

            <section className={blockClassName}>
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold">GitHub</h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Follow along or reach out through GitHub for code-related discussion and project visibility.
              </p>
              <Link
                href="https://github.com/sumitKumar-webdev"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-between rounded-xl border border-cyan-300/22 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/16"
              >
                <span>github.com/sumitKumar-webdev</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </Link>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
