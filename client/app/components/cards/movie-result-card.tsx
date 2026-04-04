"use client";

import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import PosterFallback from "@/app/components/PosterFallback/poster-fallback";
import HoverMarqueeText from "@/app/components/ui/hover-marquee-text";
import { cn } from "@/lib/utils";
import { formatLabel } from "@/lib/resuable-component";

export type MovieCardDetails = {
  imdbId?: string;
  posterUrl: string;
  title: string;
  releaseYear: string;
  titleType: string;
  rating?: number | string;
  language?: string;
  matchScore?: number;
};

type MovieResultCardProps = {
  movie: MovieCardDetails;
  className?: string;
  onClick?: () => void;
};

export default function MovieResultCard({
  movie,
  className,
  onClick,
}: MovieResultCardProps) {
  const {
    posterUrl,
    title,
    releaseYear,
    titleType,
    rating,
    language,
    matchScore,
  } = movie;
  const [posterError, setPosterError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={cn(
        "group overflow-hidden rounded-[0.7rem] border border-white/10 bg-[#1a1a20] text-white transition-all duration-500",
        onClick
          ? "cursor-pointer hover:border-cyan-400/20 hover:shadow-[0_18px_40px_rgba(8,145,178,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/80"
          : "",
        className,
      )}
    >
      <div className="relative">
        {Boolean(matchScore) && (
          <div className="absolute right-1 top-2 z-10 rounded-xl bg-[rgba(9,12,15,0.58)] px-2 py-0.5 text-[10px] font-medium text-white shadow-[0_10px_24px_rgba(6,182,212,0.22)]">
            {matchScore}% Match
          </div>
        )}

        <div className="relative aspect-[0.76] overflow-hidden bg-[#101014]">
          {hasPoster ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={cn(
                "object-cover transition-transform duration-700",
                isHovered ? "scale-[1.04]" : "scale-100",
              )}
              onError={() => setPosterError(true)}
            />
          ) : (
            <PosterFallback title={title} />
          )}

          <div
            className={cn(
              "absolute inset-0 bg-linear-to-t from-black/85 via-black/12 to-transparent transition-opacity duration-500",
              isHovered ? "opacity-100" : "opacity-70",
            )}
          />

          {(rating || language) && (
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 p-4 text-xs transition-all duration-500",
                isHovered
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0",
              )}
            >
              {rating ? (
                <div className="mb-1.5 flex items-center gap-1.5 text-cyan-300">
                  <Star className="h-3 w-3 fill-cyan-300" />
                  <span>{rating}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-white/60">
                {language ? <span>{language}</span> : null}
                {language ? <span>&bull;</span> : null}
                <span>{formatLabel(titleType)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-2 py-1.5">
        <div className="overflow-hidden">
          <h3 className="text-[0.7rem] md:text-[0.9rem] font-semibold tracking-tight text-white">
            <HoverMarqueeText
              text={title}
              hoverActive={isHovered}
              className="text-[0.7rem] md:text-[0.9rem] font-semibold tracking-tight"
            />
          </h3>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-white/45">{releaseYear}</span>
          <span className="rounded-full bg-white/6 px-2.5 py-0.5 text-xs text-white/68">
            {formatLabel(titleType)}
          </span>
        </div>
      </div>
    </div>
  );
}
