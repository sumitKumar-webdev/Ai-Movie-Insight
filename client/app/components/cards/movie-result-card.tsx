"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/app/components/ui/card";
import PosterFallback from "@/app/components/PosterFallback/poster-fallback";
import { cn } from "@/lib/utils";
import { formatLabel } from "@/lib/resuable-component";

type MovieResultCardProps = {
  imdbId?: string;
  posterUrl: string;
  title: string;
  releaseYear: string;
  titleType: string;
  className?: string;
  onClick?: () => void;
  tone?: "dark" | "light";
};

export default function MovieResultCard({
  imdbId,
  posterUrl,
  title,
  releaseYear,
  titleType,
  className,
  onClick,
  tone = "dark",
}: MovieResultCardProps) {
  const [posterError, setPosterError] = useState(false);
  const hasPoster = Boolean(posterUrl) && posterUrl !== "N/A" && !posterError;
  const isLight = tone === "light";

  return (
    <Card
      className={cn(
        isLight
          ? "cursor-pointer overflow-hidden border-slate-200 bg-white py-0 text-slate-900 transition hover:bg-slate-50"
          : "cursor-pointer overflow-hidden border-white/10 bg-white/4 py-0 text-white transition hover:bg-white/[0.07]",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-2 sm:gap-3.5 sm:p-2.5">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-14">
          {hasPoster ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 48px, 56px"
              className="h-full w-full object-cover transition-opacity duration-300"
              onError={() => setPosterError(true)}
            />
          ) : (
            <PosterFallback title={title} />
          )}
        </div>

        <CardContent className="min-w-0 p-0">
          {imdbId ? (
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-white/60")} title={imdbId}>
              {imdbId}
            </p>
          ) : null}
          <h3
            className={cn(
              "truncate text-sm font-semibold sm:text-[15px]",
              isLight ? "text-slate-900" : "text-white",
            )}
            title={title}
          >
            {title}
          </h3>
          <p className={cn("mt-0.5 text-[11px] sm:text-xs", isLight ? "text-slate-500" : "text-white/55")}>
            {formatLabel(titleType)} • {releaseYear}
          </p>
        </CardContent>
      </div>
    </Card>
  );
}
