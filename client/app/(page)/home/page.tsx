"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MovieResultCard from "@/app/components/cards/movie-result-card";
import { getSelectedMovieSearchHistory } from "@/lib/saveToStorage/search-selection-history";
import { Badge } from "@/app/components/ui/badge";
import InterestPanelSkeleton from "@/app/components/skeleton-loader/interest-panel-skeleton";
import MovieCardSkeleton from "@/app/components/skeleton-loader/movie-card-skeleton";
import { MovieSearchItem } from "@/app/modal/service.modal";
import UserPreferencesModal from "@/app/modal/user-preferences-modal";
import {
  getPersonalSelection,
  listTitles,
} from "@/app/services/movie.service";
import { buildHomeTitleFilters } from "@/app/services/home.service";
import { useAuthStore } from "@/app/store/store";
import {
  getUserInterestedCategories,
  UserInterestedCategory,
} from "@/lib/user-interested-categories";
import { InterestProfile } from "./intrest-panel";

function buildInterestSignals(
  categories: UserInterestedCategory[],
  preferredGenres: string[],
) {
  return Array.from(
    new Set(
      [...categories.map((category) => category.category), ...preferredGenres]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);
}

function buildInterestWeightMap(
  categories: UserInterestedCategory[],
  preferredGenres: string[],
) {
  const interestWeights = new Map<string, number>();

  categories.forEach((category, index) => {
    const normalizedCategory = category.category.trim().toLowerCase();
    if (!normalizedCategory) {
      return;
    }

    const baseWeight = Math.max(1, category.count) * 12;
    const rankBoost = Math.max(0, 18 - index * 3);
    interestWeights.set(
      normalizedCategory,
      Math.max(
        interestWeights.get(normalizedCategory) ?? 0,
        baseWeight + rankBoost,
      ),
    );
  });

  preferredGenres.forEach((genre) => {
    const normalizedGenre = genre.trim().toLowerCase();
    if (!normalizedGenre) {
      return;
    }

    interestWeights.set(
      normalizedGenre,
      Math.max(interestWeights.get(normalizedGenre) ?? 0, 22),
    );
  });

  return interestWeights;
}

async function buildMovieMatchScoreMap(
  movies: MovieSearchItem[],
  interestWeights: Map<string, number>,
) {
  if (!movies.length || interestWeights.size === 0) {
    return new Map<string, number>();
  }

  const maxPossibleScore = Array.from(interestWeights.values()).reduce(
    (total, value) => total + value,
    0,
  );

  const scoreMap = new Map<string, number>();

  movies.forEach((movie) => {
    const movieGenreSet = new Set(
      (Array.isArray(movie.genres) ? movie.genres : [])
        .map((genre) => genre.trim().toLowerCase())
        .filter(Boolean),
    );

    if (!movieGenreSet.size) {
      return;
    }

    let matchedWeight = 0;
    movieGenreSet.forEach((genre) => {
      matchedWeight += interestWeights.get(genre) ?? 0;
    });

    if (matchedWeight <= 0 || maxPossibleScore <= 0) {
      return;
    }

    const percentage = Math.round((matchedWeight / maxPossibleScore) * 100);
    scoreMap.set(movie.imdbId, Math.max(45, Math.min(98, percentage)));
  });

  return scoreMap;
}

function pickUniqueMovies(
  movies: MovieSearchItem[],
  excludedMovieIds: Set<string>,
  limit: number,
) {
  const nextMovies: MovieSearchItem[] = [];

  movies.forEach((movie) => {
    const imdbId = movie.imdbId.trim().toLowerCase();
    if (!imdbId || excludedMovieIds.has(imdbId) || nextMovies.length >= limit) {
      return;
    }

    excludedMovieIds.add(imdbId);
    nextMovies.push(movie);
  });

  return nextMovies;
}

async function loadInterestReleaseMovies(
  fallbackGenres: string[],
  preferences: {
    cinemas?: string[];
    genres?: string[];
    languages?: string[];
    moods?: string[];
    formats?: string[];
  },
  excludedMovieIds: Set<string>,
) {
  const filters = buildHomeTitleFilters({
    mode: "release",
    fallbackGenres,
    preferences,
  });

  if (
    !filters.languageCodes?.length &&
    !filters.countryCodes?.length &&
    !filters.genres?.length
  ) {
    return [];
  }

  const { items } = await listTitles(filters);

  return pickUniqueMovies(items, excludedMovieIds, 10);
}

async function loadInterestContentMovies(
  fallbackGenres: string[],
  preferences: {
    cinemas?: string[];
    genres?: string[];
    languages?: string[];
    moods?: string[];
    formats?: string[];
  },
  excludedMovieIds: Set<string>,
) {
  const filters = buildHomeTitleFilters({
    mode: "interest",
    fallbackGenres,
    preferences,
  });

  if (
    !filters.genres?.length &&
    !filters.languageCodes?.length &&
    !filters.countryCodes?.length
  ) {
    return [];
  }

  const { items } = await listTitles(filters);

  return pickUniqueMovies(items, excludedMovieIds, 12);
}

export default function UserHomePage() {
  const router = useRouter();
  const user = useAuthStore((auth) => auth.user);
  const [interestReleaseMovies, setInterestReleaseMovies] = useState<
    MovieSearchItem[]
  >([]);
  const [interestCategories, setInterestCategories] = useState<
    UserInterestedCategory[]
  >([]);
  const [interestMovies, setInterestMovies] = useState<MovieSearchItem[]>([]);
  const [interestMovieScores, setInterestMovieScores] = useState<
    Map<string, number>
  >(new Map());
  const [personalSelectionMovies, setPersonalSelectionMovies] = useState<
    MovieSearchItem[]
  >([]);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [interestLoading, setInterestLoading] = useState(true);
  const [personalSelectionLoading, setPersonalSelectionLoading] =
    useState(true);
  const recentHistory = useMemo(() => getSelectedMovieSearchHistory(), []);

  useEffect(() => {
    const hydrateHomePage = async () => {
      setProfileLoading(true);
      setReleaseLoading(true);
      setInterestLoading(true);
      setPersonalSelectionLoading(true);

      try {
        const categories = await getUserInterestedCategories(
          user?.preferences?.genres ?? [],
          6,
        );

        setInterestCategories(categories);
        setProfileLoading(false);

        const interestSignals = buildInterestSignals(
          categories,
          user?.preferences?.genres ?? [],
        );
        const interestWeights = buildInterestWeightMap(
          categories,
          user?.preferences?.genres ?? [],
        );
        const excludedMovieIds = new Set(
          recentHistory.map((movie) => movie.imdbId.trim().toLowerCase()),
        );

        const [releaseResult, contentResult, personalResult] =
          await Promise.allSettled([
            loadInterestReleaseMovies(
              interestSignals,
              user?.preferences ?? {},
              new Set(excludedMovieIds),
            ),
            loadInterestContentMovies(
              interestSignals,
              user?.preferences ?? {},
              new Set(excludedMovieIds),
            ),
            getPersonalSelection(recentHistory),
          ]);

        if (releaseResult.status === "fulfilled") {
          setInterestReleaseMovies(releaseResult.value);
        } else {
          setInterestReleaseMovies([]);
        }
        setReleaseLoading(false);

        if (contentResult.status === "fulfilled") {
          const movies = contentResult.value;
          setInterestMovies(movies);
          const contentScoreMap = await buildMovieMatchScoreMap(
            movies,
            interestWeights,
          );
          setInterestMovieScores(contentScoreMap);
        } else {
          setInterestMovies([]);
          setInterestMovieScores(new Map());
        }
        setInterestLoading(false);

        if (personalResult.status === "fulfilled") {
          setPersonalSelectionMovies(personalResult.value.items ?? []);
        } else {
          setPersonalSelectionMovies([]);
        }
        setPersonalSelectionLoading(false);
      } catch {
        setInterestCategories([]);
        setInterestReleaseMovies([]);
        setInterestMovies([]);
        setInterestMovieScores(new Map());
        setPersonalSelectionMovies([]);
        setProfileLoading(false);
        setReleaseLoading(false);
        setInterestLoading(false);
        setPersonalSelectionLoading(false);
      } finally {
        setProfileLoading(false);
      }
    };
    hydrateHomePage();
  }, [
    recentHistory,
    user?.preferences?.cinemas,
    user?.preferences?.formats,
    user?.preferences?.genres,
    user?.preferences?.languages,
    user?.preferences?.moods,
  ]);

  const interestLanguages = useMemo(() => {
    const saved = user?.preferences?.languages ?? [];
    return saved.slice(0, 3);
  }, [user?.preferences?.languages]);

  const interestCinemas = useMemo(() => {
    const saved = user?.preferences?.cinemas ?? [];
    return saved.slice(0, 4);
  }, [user?.preferences?.cinemas]);

  const viewingStyle = useMemo(() => {
    return (
      user?.preferences?.formats?.[0] ??
      user?.preferences?.cinemas?.[0] ??
      "Late night binge-watcher"
    );
  }, [user?.preferences?.cinemas, user?.preferences?.formats]);

  return (
    <main className="min-h-screen relative bg-[#0a0a0f] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="home-ambient-fade-in home-ambient-drift-one absolute -left-20 top-0 h-96 w-96 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(34, 211, 238, 0.78) 0%, rgba(59, 130, 246, 0.42) 34%, rgba(34, 211, 238, 0.08) 62%, transparent 74%)",
          }}
        />
        <div
          className="home-ambient-fade-in home-ambient-drift-two absolute left-50 -top-2 h-80 w-80 rounded-full blur-3xl"
          style={{
            animationDelay: "550ms",
            background:
              "radial-gradient(circle, rgba(251, 191, 36, 0.34) 0%, rgba(244, 114, 182, 0.24) 36%, rgba(168, 85, 247, 0.08) 62%, transparent 76%)",
          }}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-350 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-13">
          <div className="space-y-10 lg:col-span-9">
            <section>
              <div className="mb-6">
                <h1 className="text-[1rem] md:text-[1.5rem] font-semibold tracking-tight text-white">
                  New Releases for Your Interest
                </h1>
                <p className="text-sm md:text-base text-white/45">
                  Fresh releases matched to your preferred languages and cinema regions
                </p>
              </div>

              {releaseLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <MovieCardSkeleton key={item} />
                  ))}
                </div>
              ) : interestReleaseMovies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                  {interestReleaseMovies.map((movie) => (
                    <div key={movie.imdbId}>
                      <MovieResultCard
                        movie={{
                          imdbId: movie.imdbId,
                          title: movie.title,
                          releaseYear: movie.year,
                          posterUrl: movie.poster,
                          titleType: movie.type,
                        }}
                        onClick={() => router.push(`/content/${movie.imdbId}`)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.8rem] border border-dashed border-white/10 bg-white/0.02 p-6 text-sm text-white/50">
                  No new movies available right now.
                </div>
              )}
            </section>

            <section>
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[1rem] md:text-[1.5rem] font-semibold flex items-baseline gap-0 tracking-tight text-whit">
                    Cine{" "}
                    <span className="bg-[linear-gradient(180deg,#5ed8ff_0%,#1698ff_100%)] bg-clip-text font-bold text-transparent pr-1">
                      AI
                    </span>
                    Personal Selection For You
                  </h2>

                  <Badge className="rounded-full border border-cyan-500/90 shadow-2xs shadow-cyan-400 bg-white/5 px-3 py-1 text-xs font-medium text-white/65">
                    Weekly Refresh
                  </Badge>
                </div>
                <p className="text-sm md:text-base text-white/45">
                  Stored weekly picks built from your search history and
                  interest
                </p>
              </div>

              {personalSelectionLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <MovieCardSkeleton key={item} />
                  ))}
                </div>
              ) : personalSelectionMovies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                  {personalSelectionMovies.map((movie, index) => (
                    <div key={movie.imdbId}>
                      <MovieResultCard
                        movie={{
                          imdbId: movie.imdbId,
                          title: movie.title,
                          releaseYear: movie.year,
                          posterUrl: movie.poster,
                          titleType: movie.type,
                          matchScore: 96 - index * 2,
                        }}
                        className="border-white/10 bg-[#1a1a20] shadow-none"
                        onClick={() => router.push(`/content/${movie.imdbId}`)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.8rem] border border-dashed border-white/10 bg-white/0.02 p-6 text-sm text-white/50">
                  Personal selections will appear after you explore a few
                  movies.
                </div>
              )}
            </section>

            <section>
              <div className="mb-6">
                <h2 className="text-[1rem] md:text-[1.5rem] font-semibold tracking-tight text-white">
                  Content Based on Your Interest
                </h2>
                <p className="text-sm md:text-base text-white/45">
                  Popular picks matching the taste signals from your searches
                </p>
              </div>

              {interestLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <MovieCardSkeleton key={item} />
                  ))}
                </div>
              ) : interestMovies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {interestMovies.map((movie) => (
                    <div key={movie.imdbId}>
                      <MovieResultCard
                        movie={{
                          imdbId: movie.imdbId,
                          title: movie.title,
                          releaseYear: movie.year,
                          posterUrl: movie.poster,
                          titleType: movie.type,
                          matchScore: interestMovieScores.get(movie.imdbId),
                        }}
                        className="border-white/10 bg-[#1a1a20] shadow-none"
                        onClick={() => router.push(`/content/${movie.imdbId}`)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.8rem] border border-dashed border-white/10 bg-white/0.02 p-6 text-sm text-white/50">
                  No interest-based movies yet. Open a few titles from search
                  and this section will start filling up.
                </div>
              )}
            </section>
          </div>

          <aside className="hidden lg:col-span-4 lg:block">
            <div className="lg:sticky lg:top-24 lg:h-fit">
              {profileLoading ? (
                <InterestPanelSkeleton />
              ) : (
                <InterestProfile
                  categories={interestCategories}
                  cinemas={interestCinemas}
                  languages={interestLanguages}
                  viewingStyle={viewingStyle}
                  recentlyWatched={recentHistory.length}
                  onEditPreferences={() => setPreferencesModalOpen(true)}
                />
              )}
            </div>
          </aside>
        </div>
      </div>
      <UserPreferencesModal
        open={preferencesModalOpen}
        onOpenChange={setPreferencesModalOpen}
      />
    </main>
  );
}
