"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  getMovieAiInsightByImdbId,
  getMovieByImdbId,
  getSeasonsByImdbId,
} from "@/app/services/movie.service";
import {
  MovieAiInsight,
  MovieDetails,
  MovieSeason,
} from "@/app/models/service.modal";
import {
  clearAuthState,
  useAuthStore,
} from "@/app/store/store";
import { setRouteProgressLoading } from "@/app/components/ui/route-progress";
import InfoSection from "./components/info-section";
import AIInsightCard from "./components/ai-insight-card";
import CastCrewSection from "./components/cast-crew-section";
import ExpandableText from "@/app/components/ExpandableText/ExpandableText";
import ReviewsSection from "./components/reviews-section";
import AuthRequiredModal from "@/app/modal/auth-required-modal";

export default function MovieInsightPage() {
  const params = useParams<{ imdbId: string }>();
  const pathname = usePathname();
  const imdbId = Array.isArray(params.imdbId)
    ? (params.imdbId[0] ?? "")
    : (params.imdbId ?? "");

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [aiInsight, setAiInsight] = useState<MovieAiInsight | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<MovieSeason[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [refreshAI, setRefreshAI] = useState(false);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const currentUserId = useAuthStore((auth) => auth.user?.id ?? "");
  const isPageLoading = detailsLoading || insightLoading;

  const isSeriesType = (type: string | undefined) => {
    const normalized = String(type ?? "").toLowerCase();
    return normalized.includes("tv") || normalized.includes("series");
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!imdbId) {
        setDetailsLoading(false);
        return;
      }

      setDetailsLoading(true);
      setError(null);
      setCanWriteReview(false);
      try {
        const movieResponse = await getMovieByImdbId(imdbId);
        setMovie(movieResponse);
        setCanWriteReview(movieResponse?.isReleased === true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Movie not found";
        setError(message);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [imdbId]);

  useEffect(() => {
    if (!movie?.imdbId || !isSeriesType(movie.type)) {
      setSeasons([]);
      setSeasonsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSeasons = async () => {
      setSeasonsLoading(true);
      try {
        const seasonsResponse = await getSeasonsByImdbId(movie.imdbId);
        if (!cancelled) {
          setSeasons(seasonsResponse);
        }
      } catch {
        if (!cancelled) {
          setSeasons([]);
        }
      } finally {
        if (!cancelled) {
          setSeasonsLoading(false);
        }
      }
    };

    void fetchSeasons();

    return () => {
      cancelled = true;
    };
  }, [movie?.imdbId, movie?.type]);

  useEffect(() => {
    const fetchAiInsight = async () => {
      if (!imdbId) {
        setInsightLoading(false);
        return;
      }

      setInsightLoading(true);
      setInsightError(null);

      try {
        const insightResponse = await getMovieAiInsightByImdbId(imdbId);
        setAiInsight(insightResponse);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Movie insight not found";
        setInsightError(message);
      } finally {
        setInsightLoading(false);
      }
    };
    fetchAiInsight();
  }, [imdbId, refreshAI]);

  useEffect(() => {
    setRouteProgressLoading(isPageLoading);
  }, [isPageLoading]);

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
      <InfoSection
        loading={detailsLoading}
        movie={movie}
        seasons={seasons}
        seasonsLoading={seasonsLoading}
      />

      <section className="mx-auto grid w-full grid-cols-1 gap-6 px-2 py-8 md:px-12 xl:grid-cols-[1fr_450px]">
        <div className="max-w-4xl space-y-6">
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

          {Boolean(movie?.cast.length) && <CastCrewSection
            loading={detailsLoading}
            title="Cast"
            people={movie?.cast ?? []}
          />}

         {Boolean(movie?.crew.length) && <CastCrewSection
            loading={detailsLoading}
            title="Crew"
            people={movie?.crew ?? []}
          />}

          <div className="xl:hidden">
            <AIInsightCard
              loading={insightLoading}
              data={
                aiInsight
                  ? {
                      sentiment: aiInsight.sentiment,
                      summary: aiInsight.summary,
                      confidence: aiInsight.confidence,
                    }
                  : null
              }
              isReleased={movie?.isReleased}
              releaseDate={movie?.releaseDate}
              error={insightError}
            />
          </div>

          {movie ? (
            <ReviewsSection
              imdbId={imdbId}
              movieTitle={movie?.title ?? ""}
              movieYear={movie?.year ?? ""}
              movieType={movie?.type ?? ""}
              posterUrl={movie?.poster ?? ""}
              currentUserId={currentUserId}
              canWriteReview={canWriteReview}
              releaseStatusResolved={!detailsLoading}
              onUnauthorized={() => {
                clearAuthState();
                setAuthModalOpen(true);
              }}
              onRefreshInsight={() => setRefreshAI((current) => !current)}
            />
          ) : null}
        </div>

        <div className="hidden space-y-6 xl:block">
          <AIInsightCard
            loading={insightLoading}
            data={
              aiInsight
                ? {
                    sentiment: aiInsight.sentiment,
                    summary: aiInsight.summary,
                    confidence: aiInsight.confidence,
                  }
                : null
            }
            isReleased={movie?.isReleased}
            releaseDate={movie?.releaseDate}
            error={insightError}
          />
        </div>
      </section>

      <AuthRequiredModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        nextPath={pathname || "/"}
      />
    </main>
  );
}
