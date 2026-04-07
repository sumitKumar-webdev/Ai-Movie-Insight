"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Star } from "lucide-react";
import PosterFallback from "@/app/components/PosterFallback/poster-fallback";
import AnimatedBackdropFallback from "@/app/components/ui/animated-backdrop-fallback";
import CompactCount from "@/app/components/ui/compact-count";
import MetaValueList from "@/app/components/ui/meta-value-list";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";
import { MovieDetails, MovieSeason } from "@/app/models/service.modal";
import { formatLabel } from "@/lib/resuable-component";
import PlaybackModal from "./playback-modal";

type InfoSectionProps = {
  loading: boolean;
  movie: MovieDetails | null;
  seasons: MovieSeason[];
  seasonsLoading: boolean;
};

function isAvailableValue(value?: string | null) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    Boolean(normalized) &&
    normalized !== "n/a" &&
    normalized !== "unavailable" &&
    normalized !== "unknown"
  );
}

const InfoSection = ({
  loading,
  movie,
  seasons,
  seasonsLoading,
}: InfoSectionProps) => {
  const [loadedBackdropSrc, setLoadedBackdropSrc] = useState("");
  const [loadedPosterSrc, setLoadedPosterSrc] = useState("");
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const metaData = [formatLabel(movie?.type ?? ""), movie?.year, movie?.runtime]
    .filter(isAvailableValue)
    .join(" • ");
  const normalizedType = movie?.type?.toLowerCase() ?? "";
  const canPlayFromBackdrop = Boolean(
    !loading &&
    movie?.isReleased === true &&
    (normalizedType.includes("movie") ||
      normalizedType.includes("tv") ||
      normalizedType.includes("series")),
  );
  const isSeries =
    normalizedType.includes("tv") || normalizedType.includes("series");

  return (
    <section className="relative min-h-100 overflow-hidden border-b border-white/10 sm:min-h-144 md:h-[78vh] md:min-h-155">
      {loading ? (
        <Skeleton className="absolute inset-0 rounded-none bg-white/10" />
      ) : movie?.backdrop ? (
        <Image
          src={movie.backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          onLoad={() => setLoadedBackdropSrc(movie.backdrop)}
          className={`absolute inset-0 h-20 object-cover object-center transition-opacity duration-700 ease-out md:mt-0 ${
            loadedBackdropSrc === movie.backdrop ? "opacity-70" : "opacity-0"
          }`}
        />
      ) : (
        <AnimatedBackdropFallback className="absolute inset-0" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.1)_16%,rgba(0,0,0,0.34)_42%,rgba(0,0,0,0.8)_72%,rgba(0,0,0,1)_100%)] md:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.72))]" />

      {canPlayFromBackdrop && movie ? (
        <div className="absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-7xl justify-end px-4 pt-4 sm:px-5 sm:pt-5 md:px-6 md:pt-6">
          <Button
            type="button"
            onClick={() => setPlaybackOpen(true)}
            className="rounded-full border border-white/15 bg-white/12 px-4 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md hover:bg-white/18 text-xs md:text-sm"
          >
            <Play className="fill-current" />
            Play Now
          </Button>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-7xl -translate-y-8 px-4 pb-3 sm:-translate-y-10 sm:px-5 sm:pb-4 md:translate-y-0 md:px-6 md:pb-10">
          <div className="grid grid-cols-[112px_1fr] items-end gap-4 sm:grid-cols-[140px_1fr] sm:gap-5 md:grid-cols-[260px_1fr] md:gap-6">
            {loading ? (
              <Skeleton className="h-50 w-28 rounded-[1.35rem] bg-white/12 sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl" />
            ) : movie?.poster && movie.poster !== "N/A" ? (
              <Image
                src={movie.poster}
                alt={movie.title ?? ""}
                width={260}
                height={320}
                sizes="(max-width: 768px) 220px, 260px"
                onLoad={() => setLoadedPosterSrc(movie.poster)}
                className={`h-50 w-28 rounded-[1.35rem] border border-white/10 object-cover shadow-[0_24px_60px_rgba(0,0,0,0.52)] transition-opacity duration-500 ease-out sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl md:border-white/20 md:shadow-[0_25px_55px_rgba(0,0,0,0.55)] ${
                  loadedPosterSrc === movie.poster ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              <div className="h-50 w-28 overflow-hidden rounded-[1.35rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.52)] sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl md:border-white/20 md:shadow-[0_25px_55px_rgba(0,0,0,0.55)]">
                <PosterFallback title={movie?.title} />
              </div>
            )}

            <div className="min-w-0 space-y-3 sm:space-y-4 md:space-y-5">
              <div>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-28 bg-white/12 sm:h-4 sm:w-44" />
                    <Skeleton className="h-7 w-34 bg-white/15 sm:h-10 sm:w-64 md:h-12 md:w-80" />
                  </div>
                ) : (
                  <>
                    <p className="overflow-x-auto whitespace-nowrap text-[11px] leading-4 text-white/65 [scrollbar-width:none] sm:text-sm">
                      {metaData}
                    </p>
                    <h1 className="max-w-44 text-[1.75rem] font-semibold leading-[1.03] tracking-[-0.03em] sm:max-w-none sm:text-3xl md:text-4xl">
                      {movie?.title}
                    </h1>
                  </>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 md:grid-cols-4 md:gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="space-y-2">
                      <Skeleton className="h-3 w-16 bg-white/12" />
                      <Skeleton className="h-4 w-20 bg-white/15" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] leading-4 text-white/80 sm:text-sm md:gap-4 ${
                    isSeries ? "md:grid-cols-5" : "md:grid-cols-4"
                  }`}
                >
                  <div>
                    <p className="text-white/50">Country</p>
                    <MetaValueList values={movie?.country} label="countries" />
                  </div>
                  <div>
                    <p className="text-white/50">Language</p>
                    <MetaValueList values={movie?.language} label="languages" />
                  </div>
                  <div>
                    <p className="text-white/50">Release Date</p>
                    <p className="mt-1 font-medium">{movie?.releaseDate}</p>
                  </div>
                  <div>
                    <p className="text-white/50">IMDb</p>
                    <div className="mt-1 flex gap-2 space-y-1">
                      <p className="flex items-center font-medium">
                        <Star className="mr-1 h-3.5 w-3.5 fill-yellow-300 text-yellow-300 sm:h-4 sm:w-4" />
                        {movie?.rating}
                        {movie?.rating != "N/A" && (
                          <span className="text-white/60">/10</span>
                        )}
                      </p>
                      <CompactCount
                        value={movie?.ratingCount}
                        suffix="reviews"
                        className="text-[10px] text-white/55 sm:text-xs"
                      />
                    </div>
                  </div>
                  {isSeries ? (
                    <div>
                      <p className="text-white/50">Seasons</p>
                      <p className="mt-1 font-medium">
                        {seasonsLoading ? "Loading..." : seasons.length || "N/A"}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {movie ? (
        <PlaybackModal
          movie={movie}
          seasons={seasons}
          seasonsLoading={seasonsLoading}
          open={playbackOpen}
          onOpenChange={setPlaybackOpen}
        />
      ) : null}
    </section>
  );
};

export default InfoSection;
