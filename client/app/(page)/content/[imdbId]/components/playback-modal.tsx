"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Tv2, Film } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import HoverMarqueeText from "@/app/components/ui/hover-marquee-text";
import SelectDropdown from "@/app/components/ui/select-dropdown";
import { formatLabel } from "@/lib/resuable-component";
import {
  MovieDetails,
  MoviePlayback,
  MovieSeason,
} from "@/app/models/service.modal";
import { getPlaybackByImdbId } from "@/app/services/movie.service";

const brandHex = "5ed8ff";
const brandRgb = {
  r: parseInt(brandHex.slice(0, 2), 16),
  g: parseInt(brandHex.slice(2, 4), 16),
  b: parseInt(brandHex.slice(4, 6), 16),
};
const brandRgbString = `${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}`;

function buildInitialPlayback(
  movie: MovieDetails,
  seasons: MovieSeason[],
): MoviePlayback {
  const mediaType =
    movie.type.toLowerCase().includes("tv") ||
    movie.type.toLowerCase().includes("series")
      ? "tv"
      : "movie";
  const firstSeason = seasons[0];

  return {
    imdbId: movie.imdbId,
    tmdbId: movie.tmdbId ?? null,
    mediaType,
    season: mediaType === "tv" ? (firstSeason?.season ?? 1) : null,
    episode: mediaType === "tv" ? (firstSeason?.episodeCount ? 1 : null) : null,
  };
}

function buildIframeSrc(playback: MoviePlayback): string {
  if (!playback.tmdbId) return "";

  if (playback.mediaType === "movie") {
    return `https://player.videasy.net/movie/${playback.tmdbId}?color=${brandHex}`;
  }

  const season = Math.max(1, playback.season ?? 1);
  const episode = Math.max(1, playback.episode ?? 1);
  return `https://player.videasy.net/tv/${playback.tmdbId}/${season}/${episode}?color=${brandHex}`;
}

type DropdownOption = {
  label: string;
  value: number;
};

type PlaybackModalProps = {
  movie: MovieDetails;
  seasons: MovieSeason[];
  seasonsLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PlaybackModal = ({
  movie,
  seasons,
  seasonsLoading,
  open,
  onOpenChange,
}: PlaybackModalProps) => {
  const [playback, setPlayback] = useState<MoviePlayback>(() =>
    buildInitialPlayback(movie, seasons),
  );
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const isSeries = playback.mediaType === "tv";
  const selectedSeason = seasons.find(
    (item) => item.season === (playback.season ?? -1),
  );
  const episodeCountForSelectedSeason = selectedSeason?.episodeCount ?? 0;
  const hasEpisodeData = episodeCountForSelectedSeason > 0;
  const episodeOptions = hasEpisodeData
    ? Array.from(
        { length: episodeCountForSelectedSeason },
        (_, index) => index + 1,
      )
    : [];
  const seasonOptions: DropdownOption[] = seasons.map((item) => ({
    value: item.season,
    label: `Season ${item.season}`,
  }));

  useEffect(() => {
    setPlayback(buildInitialPlayback(movie, seasons));
    setPlaybackError(null);
  }, [movie.imdbId, movie.tmdbId, movie.type, seasons]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadPlayback = async () => {
      setLoadingPlayback(true);
      setPlaybackError(null);

      try {
        const data = await getPlaybackByImdbId(movie.imdbId);
        if (cancelled) return;
        if (data.mediaType === "tv") {
          const fallbackSeason = seasons[0];
          const nextSeason =
            seasons.find((item) => item.season === data.season) ??
            fallbackSeason;
          const safeSeason = nextSeason?.season ?? data.season ?? 1;
          const maxEpisode = nextSeason?.episodeCount ?? 0;
          const safeEpisode =
            maxEpisode > 0
              ? Math.min(Math.max(1, data.episode ?? 1), maxEpisode)
              : (data.episode ?? null);

          setPlayback({
            ...data,
            season: safeSeason,
            episode: safeEpisode,
          });
        } else {
          setPlayback(data);
        }
        if (!data.tmdbId) {
          setPlaybackError("Playback is not available for this title yet.");
        }
      } catch (error) {
        if (cancelled) return;
        setPlayback((prev) => ({ ...prev, tmdbId: null }));
        setPlaybackError(
          error instanceof Error
            ? error.message
            : "Playback is not available for this title yet.",
        );
      } finally {
        if (!cancelled) setLoadingPlayback(false);
      }
    };

    void loadPlayback();
    return () => {
      cancelled = true;
    };
  }, [movie.imdbId, open, seasons]);

  const iframeSrc = useMemo(
    () => buildIframeSrc(playback),
    [playback.tmdbId, playback.mediaType, playback.season, playback.episode],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-6xl gap-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
        contentWrapperClassName="items-center justify-center p-3 sm:p-5"
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-3 border-b border-white/0.06 px-4 py-3 pr-12 sm:px-5 sm:py-4 sm:pr-14">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `rgba(${brandRgbString}, 0.1)`,
              color: `rgb(${brandRgbString})`,
            }}
          >
            {isSeries ? (
              <Tv2 className="h-4 w-4" />
            ) : (
              <Film className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="min-w-0 overflow-hidden pr-2 text-base font-semibold leading-tight text-white sm:text-lg">
              <HoverMarqueeText
                text={movie.title}
                hoverActive
                className="text-base font-semibold leading-tight sm:text-lg"
               wrapperClassName="block w-full"
              />
            </DialogTitle>
            <p className="mt-0.5 text-xs text-white/40">
              {formatLabel(movie.type)} · {movie.year}
            </p>
          </div>
        </div>

        {isSeries ? (
          <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="order-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 md:order-1">
              <SelectDropdown
                label="Season"
                value={playback.season ?? 1}
                options={seasonOptions}
                disabled={seasonsLoading || seasons.length === 0}
                placeholder={seasonsLoading ? "Loading seasons..." : "Season 1"}
                onChange={(nextSeason) =>
                  setPlayback((prev) => ({
                    ...prev,
                    season: Math.max(1, nextSeason || 1),
                    episode: 1,
                  }))
                }
              />

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Episodes
                </p>
                <div className="home-search-scroll grid max-h-[26vh] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:max-h-[30vh] md:max-h-[36vh] md:grid-cols-1 md:space-y-1.5 md:gap-0">
                  {episodeOptions.length > 0 ? (
                    episodeOptions.map((episodeNumber) => {
                      const isActive =
                        (playback.episode ?? 1) === episodeNumber;
                      return (
                        <button
                          key={episodeNumber}
                          type="button"
                          onClick={() =>
                            setPlayback((prev) => ({
                              ...prev,
                              episode: episodeNumber,
                            }))
                          }
                          className={`flex h-9 w-full items-center rounded-md border px-2.5 text-left text-xs transition-colors sm:px-3 sm:text-sm ${
                            isActive
                              ? "text-white"
                              : "border-white/10 bg-black/30 text-white/75 hover:border-white/25 hover:text-white"
                          }`}
                          style={
                            isActive
                              ? {
                                  borderColor: `rgba(${brandRgbString}, 0.8)`,
                                  backgroundColor: `rgba(${brandRgbString}, 0.15)`,
                                  color: `rgb(${brandRgbString})`,
                                }
                              : undefined
                          }
                        >
                          Episode {episodeNumber}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-xs text-white/40">
                      {seasonsLoading
                        ? "Loading episodes..."
                        : "Episodes unavailable"}
                    </p>
                  )}
                </div>
              </div>
            </aside>

            <div className="order-1 overflow-hidden rounded-xl border border-white/[0.07] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.6)] md:order-2">
              {loadingPlayback ? (
                <div className="flex h-[30vh] items-center justify-center gap-2.5 text-sm text-white/40 sm:h-[46vh] md:h-[55vh]">
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    style={{ color: `rgb(${brandRgbString})` }}
                  />
                  <span>Loading playback...</span>
                </div>
              ) : iframeSrc ? (
                <div className="relative h-0 w-full pb-[48%]">
                  <iframe
                    key={iframeSrc}
                    src={iframeSrc}
                    className="absolute left-0 top-0 h-full w-full bg-black"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  />
                </div>
              ) : (
                <div className="flex h-[30vh] flex-col items-center justify-center gap-2 px-6 text-center sm:h-[46vh] sm:px-8 md:h-[55vh]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/20">
                    <Tv2 className="h-5 w-5" />
                  </div>
                  <p className="max-w-xs text-sm text-white/40">
                    {playbackError ??
                      "Playback is not available for this title yet."}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              {loadingPlayback ? (
                <div className="flex h-[38vh] items-center justify-center gap-2.5 text-sm text-white/40 sm:h-[55vh]">
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    style={{ color: `rgb(${brandRgbString})` }}
                  />
                  <span>Loading playback...</span>
                </div>
              ) : iframeSrc ? (
                <div className="relative h-0 w-full pb-[48%]">
                  <iframe
                    key={iframeSrc}
                    src={iframeSrc}
                    className="absolute left-0 top-0 h-full w-full bg-black"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  />
                </div>
              ) : (
                <div className="flex h-[38vh] flex-col items-center justify-center gap-2 px-8 text-center sm:h-[55vh]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/20">
                    <Film className="h-5 w-5" />
                  </div>
                  <p className="max-w-xs text-sm text-white/40">
                    {playbackError ??
                      "Playback is not available for this title yet."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlaybackModal;
