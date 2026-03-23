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
};

export default function MovieResultCard({
  imdbId,
  posterUrl,
  title,
  releaseYear,
  titleType,
  className,
  onClick,
}: MovieResultCardProps) {
  const [posterError, setPosterError] = useState(false);
  const hasPoster = Boolean(posterUrl) && posterUrl !== "N/A" && !posterError;

  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden border-white/10 bg-white/4 py-0 text-white transition hover:bg-white/[0.07]",
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
            <p className={cn("text-xs", "text-white/60")} title={imdbId}>
              {imdbId}
            </p>
          ) : null}
          <h3
            className={cn(
              "truncate text-sm font-semibold sm:text-[15px]",
              "text-white",
            )}
            title={title}
          >
            {title}
          </h3>
          <p className={cn("mt-0.5 text-[11px] sm:text-xs", "text-white/55")}>
            {formatLabel(titleType)} • {releaseYear}
          </p>
        </CardContent>
      </div>
    </Card>
  );
}
