"use client";

import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  compact?: boolean;
};

export default function BrandWordmark({
  className,
  titleClassName,
  subtitleClassName,
  compact = false,
}: BrandWordmarkProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div
        className={cn(
          "flex items-baseline gap-0 text-[clamp(1.75rem,5vw,4.5rem)] font-black uppercase tracking-[0.08em] text-white",
          compact && "text-[1.1rem] tracking-[0.1em] sm:text-[1.55rem] sm:tracking-[0.12em]",
          titleClassName,
        )}
      >
        <span>CINE</span>
        <span className="bg-[linear-gradient(180deg,#5ed8ff_0%,#1698ff_100%)] bg-clip-text text-transparent">
          AI
        </span>
      </div>
      <p
        className={cn(
          "mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/78",
          compact && "mt-0 text-[0.38rem] tracking-[0.18em] text-white/68 sm:mt-0.5 sm:text-[0.54rem] sm:tracking-[0.24em]",
          subtitleClassName,
        )}
      >
        Film &amp; Series Insights | AI Assistance
      </p>
    </div>
  );
}
