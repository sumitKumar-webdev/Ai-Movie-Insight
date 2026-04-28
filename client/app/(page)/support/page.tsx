"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Github,
  Mail,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

export default function SupportPage() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-black px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        {/* Page label */}
        <p className="text-[11px] font-semibold tracking-[0.3em] text-[#5ed4f8] uppercase mb-4">
          Support Desk
        </p>

        {/* Hero heading */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-10"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Build in progress,
          <br />
          <span className="text-white/30">feedback welcome.</span>
        </h1>

        {/* Divider */}
        <div className="border-t border-white/10 mb-14" />

        {/* Main grid */}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* Left column */}
          <div className="border border-white/10">
            {/* Status strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-white/10">
              {[
                { label: "Project stage", value: "Ongoing" },
                { label: "Focus", value: "Polish + features" },
                { label: "Best input", value: "Real feedback" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`px-6 py-5 ${i < 2 ? "sm:border-r border-white/10" : ""}`}
                >
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-white/35 uppercase mb-2">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* What to expect */}
            <div className="border-b border-white/10 px-5 py-8 sm:px-8 sm:py-10">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-4 w-4 text-[#5ed4f8] shrink-0" />
                <h2
                  className="text-xl font-bold tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  What to expect next
                </h2>
              </div>
              <p className="text-sm leading-8 text-white/55 max-w-2xl">
                The current goal is to keep sharpening the browsing experience,
                assistant interactions, and the general UI feel so the app
                becomes more useful and more polished over time. If something
                feels confusing, rough, or incomplete, that kind of feedback is
                especially valuable while the product is still actively being
                shaped.
              </p>
            </div>

            {/* Best ways to help */}
            <div className="px-5 py-8 sm:px-8 sm:py-10">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquareQuote className="h-4 w-4 text-[#5ed4f8] shrink-0" />
                <h2
                  className="text-xl font-bold tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Best ways to help
                </h2>
              </div>

              <div className="space-y-0">
                {[
                  {
                    num: "01",
                    text: "Share bug reports with a short description of what happened.",
                  },
                  {
                    num: "02",
                    text: "Send UI suggestions when something feels awkward or unclear.",
                  },
                  {
                    num: "03",
                    text: "Reach out with feature ideas that would improve movie discovery.",
                  },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="flex items-start gap-6 border-t border-white/8 py-5 first:border-t-0"
                  >
                    <span className="text-[11px] font-semibold tracking-[0.15em] text-white/20 mt-0.5 shrink-0 w-6">
                      {item.num}
                    </span>
                    <p className="text-sm leading-7 text-white/60">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Email block */}
            <div className="px-5 py-7 sm:px-7 sm:py-9 border border-white/10">
              <div className="flex items-center gap-3 mb-1">
                <Mail className="h-4 w-4 text-[#5ed4f8]" />
                <h2
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Email contact
                </h2>
              </div>
              <p className="text-xs leading-6 text-white/40 mt-3 mb-6">
                For support, feedback, or collaboration — include a short note
                about what you need help with.
              </p>
              <a
                href="mailto:sumitkr8178@gmail.com"
                className="flex items-center justify-between w-full border border-white/12 px-4 py-3 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span>sumitkr8178@gmail.com</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#5ed4f8]" />
              </a>
            </div>

            {/* GitHub block */}
            <div className="px-5 py-7 sm:px-7 sm:py-9 border border-white/10">
              <div className="flex items-center gap-3 mb-1">
                <Github className="h-4 w-4 text-[#5ed4f8]" />
                <h2
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  GitHub
                </h2>
              </div>
              <p className="text-xs leading-6 text-white/40 mt-3 mb-6">
                Follow along or reach out for code-related discussion and
                project visibility.
              </p>
              <Link
                href="https://github.com/sumitKumar-webdev"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full border border-[#5ed4f8]/20 bg-[#5ed4f8]/5 px-4 py-3 text-xs font-medium text-[#5ed4f8]/80 hover:bg-[#5ed4f8]/10 hover:text-[#5ed4f8] transition-colors"
              >
                <span>github.com/sumitKumar-webdev</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </div>

            <div className="px-5 py-7 sm:px-7 sm:py-9 border border-white/10">
              <p className="text-[10px] leading-5 text-white/25 tracking-wide">
                CineAI is an independent project. Response times may vary. All
                feedback is read and appreciated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
