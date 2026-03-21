"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { getMovieByImdbId } from "@/app/services/movie.service";
import { MovieInsight } from "@/app/modal/service.modal";
import {
  clearAuthState,
  fetchCurrentUser,
  getAuthStoreState,
  useAuthStore,
} from "@/app/store/auth-store";
import InfoSection from "./components/info-section";
import AIInsightCard from "./components/ai-insight-card";
import CastCrewSection from "./components/cast-crew-section";
import ExpandableText from "@/app/components/ExpandableText/ExpandableText";
import ReviewsSection from "./components/reviews-section";

async function fetchMovieData(imdbId: string): Promise<MovieInsight> {
  return getMovieByImdbId(imdbId);
}

async function loadMoviePageData(
  imdbId: string,
  setDetailsLoading: (value: boolean) => void,
  setInsightLoading: (value: boolean) => void,
  setError: (value: string | null) => void,
  setInsightError: (value: string | null) => void,
  setMovie: (value: MovieInsight | null) => void,
  setInsight: (
    value: {
      sentiment: MovieInsight["sentiment"];
      summary: string;
      confidence: number;
    } | null,
  ) => void,
) {
  if (!imdbId) {
    setDetailsLoading(false);
    setInsightLoading(false);
    return;
  }

  setDetailsLoading(true);
  setInsightLoading(true);
  setError(null);
  setInsightError(null);
  setMovie(null);
  setInsight(null);

  try {
    const movieResponse = await fetchMovieData(imdbId);
    setMovie(movieResponse);
    setInsight({
      sentiment: movieResponse.sentiment,
      summary: movieResponse.summary,
      confidence: movieResponse.confidence,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Movie not found";
    setError(message);
    setInsightError(message);
  } finally {
    setDetailsLoading(false);
    setInsightLoading(false);
  }
}

export default function MovieInsightPage() {
  const params = useParams<{ imdbId: string }>();
  const imdbId = Array.isArray(params.imdbId)
    ? (params.imdbId[0] ?? "")
    : (params.imdbId ?? "");

  const [movie, setMovie] = useState<MovieInsight | null>(null);
  const [aiInsight, setAiInsight] = useState<{
    sentiment: MovieInsight["sentiment"];
    summary: string;
    confidence: number;
  } | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const currentUserId = useAuthStore((auth) => auth.user?.id ?? "");

  useEffect(() => {
    let cancelled = false;

    const setDetailsLoadingSafe = (value: boolean) => {
      if (!cancelled) setDetailsLoading(value);
    };
    const setInsightLoadingSafe = (value: boolean) => {
      if (!cancelled) setInsightLoading(value);
    };
    const setErrorSafe = (value: string | null) => {
      if (!cancelled) setError(value);
    };
    const setInsightErrorSafe = (value: string | null) => {
      if (!cancelled) setInsightError(value);
    };
    const setMovieSafe = (value: MovieInsight | null) => {
      if (!cancelled) setMovie(value);
    };
    const setAiInsightSafe = (
      value: {
        sentiment: MovieInsight["sentiment"];
        summary: string;
        confidence: number;
      } | null,
    ) => {
      if (!cancelled) setAiInsight(value);
    };

    void loadMoviePageData(
      imdbId,
      setDetailsLoadingSafe,
      setInsightLoadingSafe,
      setErrorSafe,
      setInsightErrorSafe,
      setMovieSafe,
      setAiInsightSafe,
    );

    return () => {
      cancelled = true;
    };
  }, [imdbId]);

  const ensureAuthenticated = async () => {
    if (getAuthStoreState().user?.id) {
      return true;
    }

    const user = await fetchCurrentUser();
    if (!user?.id) {
      return false;
    }

    return true;
  };

  if (error) {
    return (
      <main className="min-h-screen bg-black px-4 py-12 text-white md:px-6">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center">
          <div className="w-full rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-rose-200 sm:text-2xl">
              Unable to Load Movie
            </h2>
            <p className="mt-3 text-sm leading-7 text-rose-200/90 sm:text-base">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!movie && !detailsLoading) {
    return (
      <main className="min-h-screen bg-black px-4 py-12 text-white md:px-6">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center">
          <div className="w-full rounded-2xl border border-white/15 bg-white/5 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Movie Not Available
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
              We could not find details for this title right now.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <InfoSection loading={detailsLoading} movie={movie} />

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 md:px-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6 max-w-4xl">
          <Card className="border-white/10 bg-white/3 text-white">
            <CardHeader>
              {detailsLoading ? (
                <Skeleton className="h-9 w-32 bg-white/12" />
              ) : (
                <CardTitle className="text-xl md:text-3xl">Overview</CardTitle>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {detailsLoading ? (
                <>
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="h-4 w-full bg-white/12" />
                  ))}
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((item) => (
                      <Skeleton
                        key={item}
                        className="h-7 w-20 rounded-full bg-white/12"
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <ExpandableText text={movie?.overview || ""} limit={350} />
                  <div className="flex flex-wrap gap-2">
                    {movie?.genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="rounded-full bg-white/10 text-white"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <CastCrewSection
            loading={detailsLoading}
            title="Cast"
            people={movie?.cast ?? []}
          />
          <CastCrewSection
            loading={detailsLoading}
            title="Crew"
            people={movie?.crew ?? []}
          />

          <ReviewsSection
            imdbId={imdbId}
            movieTitle={movie?.title ?? ""}
            currentUserId={currentUserId}
            ensureAuthenticated={ensureAuthenticated}
            onUnauthorized={() => {
              clearAuthState();
            }}
            onRefreshInsight={async () => {
              await loadMoviePageData(
                imdbId,
                setDetailsLoading,
                setInsightLoading,
                setError,
                setInsightError,
                setMovie,
                setAiInsight,
              );
            }}
          />
        </div>

        <div className="space-y-6">
          <AIInsightCard
            loading={insightLoading}
            data={aiInsight}
            error={insightError}
          />
        </div>
      </section>
    </main>
  );
}
