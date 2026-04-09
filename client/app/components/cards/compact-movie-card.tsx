"use client";

import { useState } from "react";
import Image from "next/image";
import PosterFallback from "@/app/components/PosterFallback/poster-fallback";
import { formatLabel } from "@/lib/resuable-component";
import { cn } from "@/lib/utils";
import { MovieCardDetails } from "@/app/components/cards/movie-result-card";

type CompactMovieCardProps = {
  movie: MovieCardDetails;
  className?: string;
  onClick?: () => void;
};

export default function CompactMovieCard({
  movie,
  className,
  onClick,
}: CompactMovieCardProps) {
  const { posterUrl, title, releaseYear, titleType } = movie;
  const [posterError, setPosterError] = useState(false);
  const hasPoster = Boolean(posterUrl) && posterUrl !== "N/A" && !posterError;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "overflow-hidden rounded-[1.2rem] border border-white/10 bg-[#18181f] text-white transition-all duration-300",
        onClick
          ? "cursor-pointer hover:border-cyan-400/20 hover:bg-[#1d1d26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/30"
          : "",
        className,
      )}
    >
      <div className="flex items-center gap-3 p-2">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-[#101014] sm:h-18 sm:w-13">
          {hasPoster ? (
            <Image unoptimized
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 48px, 52px"
              className="object-cover"
              onError={() => setPosterError(true)}
            />
          ) : (
            <PosterFallback title={title} />
          )}
        </div>

        <div className="min-w-0">
          <h3
            className="mt-1 truncate text-sm font-semibold text-white"
            title={title}
          >
            {title}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            {Boolean(releaseYear) && releaseYear !== 'undefined' && (
              <span className="text-xs text-white/50">{releaseYear}</span>
            )}
            <span className="rounded-full bg-white/6 px-2.5 py-1 text-[11px] text-white/68">
              {formatLabel(titleType)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


