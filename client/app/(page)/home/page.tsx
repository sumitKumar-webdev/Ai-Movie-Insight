"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MovieResultCard from "@/app/components/cards/movie-result-card";
import { setRouteProgressLoading } from "@/app/components/ui/route-progress";
import { getSelectedMovieSearchHistory } from "@/lib/saveToStorage/search-selection-history";
import { Badge } from "@/app/components/ui/badge";
import InterestPanelSkeleton from "@/app/components/skeleton-loader/interest-panel-skeleton";
import MovieCardSkeleton from "@/app/components/skeleton-loader/movie-card-skeleton";
import { MovieSearchItem } from "@/app/models/service.modal";
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

function getMovieMatchScore(
  movie: MovieSearchItem,
  interestWeights: Map<string, number>,
) {
  if (interestWeights.size === 0) {
    return undefined;
  }

  const maxPossibleScore = Array.from(interestWeights.values()).reduce(
    (total, value) => total + value,
    0,
  );
  const movieGenreSet = new Set(
    (Array.isArray(movie.genres) ? movie.genres : [])
      .map((genre) => genre.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!movieGenreSet.size || maxPossibleScore <= 0) {
    return undefined;
  }

  let matchedWeight = 0;
  movieGenreSet.forEach((genre) => {
    matchedWeight += interestWeights.get(genre) ?? 0;
  });

  if (matchedWeight <= 0) {
    return undefined;
  }

  const percentage = Math.round((matchedWeight / maxPossibleScore) * 100);
  return Math.max(45, Math.min(98, percentage));
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

  const primaryResult = await listTitles(filters);
  const primaryPicks = pickUniqueMovies(primaryResult.items, excludedMovieIds, 10);

  if (primaryPicks.length >= 8) {
    return primaryPicks;
  }

  const fallbackFilters = {
    ...filters,
    startYear:
      typeof filters.startYear === "number" ? filters.startYear - 1 : undefined,
    endYear: new Date().getUTCFullYear() + 1,
    minVoteCount: 5,
    genres: filters.genres?.length ? filters.genres.slice(0, 3) : undefined,
  };

  const fallbackResult = await listTitles(fallbackFilters);
  const fallbackPicks = pickUniqueMovies(fallbackResult.items, excludedMovieIds, 10);

  return [...primaryPicks, ...fallbackPicks].slice(0, 10);
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
  const lastHomeRequestKeyRef = useRef<string>("");
  const preferencesRequestKey = useMemo(() => JSON.stringify({
    userId: user?.id ?? "",
    cinemas: user?.preferences?.cinemas ?? [],
    formats: user?.preferences?.formats ?? [],
    genres: user?.preferences?.genres ?? [],
    languages: user?.preferences?.languages ?? [],
    moods: user?.preferences?.moods ?? [],
    recentHistory,
  }), [
    user?.id,
    user?.preferences?.cinemas,
    user?.preferences?.formats,
    user?.preferences?.genres,
    user?.preferences?.languages,
    user?.preferences?.moods,
    recentHistory,
  ]);
  const interestWeights = useMemo(
    () => buildInterestWeightMap(interestCategories, user?.preferences?.genres ?? []),
    [interestCategories, user?.preferences?.genres],
  );

  useEffect(() => {
    const hydrateHomePage = async () => {
      if (!user?.id) {
        lastHomeRequestKeyRef.current = "";
        setInterestCategories([]);
        setInterestReleaseMovies([]);
        setInterestMovies([]);
        setPersonalSelectionMovies([]);
        setProfileLoading(false);
        setReleaseLoading(false);
        setInterestLoading(false);
        setPersonalSelectionLoading(false);
        return;
      }

      if (lastHomeRequestKeyRef.current === preferencesRequestKey) {
        return;
      }
      lastHomeRequestKeyRef.current = preferencesRequestKey;

      setProfileLoading(true);
      setReleaseLoading(true);
      setInterestLoading(true);
      setPersonalSelectionLoading(true);

      const preferredGenres = user?.preferences?.genres ?? [];
      let categories: UserInterestedCategory[] = [];
      let interestSignals: string[] = [];
      let excludedMovieIds = new Set<string>();

      try {
        categories = await getUserInterestedCategories(preferredGenres, 6);

        setInterestCategories(categories);
        setProfileLoading(false);

        interestSignals = buildInterestSignals(categories, preferredGenres);
        excludedMovieIds = new Set(
          recentHistory.map((movie) => movie.imdbId.trim().toLowerCase()),
        );
      } catch {
        setInterestCategories([]);
        setInterestReleaseMovies([]);
        setInterestMovies([]);
        setPersonalSelectionMovies([]);
        setProfileLoading(false);
        setReleaseLoading(false);
        setInterestLoading(false);
        setPersonalSelectionLoading(false);
      } finally {
        setProfileLoading(false);
      }

      loadInterestReleaseMovies(
        interestSignals,
        user?.preferences ?? {},
        new Set(excludedMovieIds),
      )
        .then((movies) => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setInterestReleaseMovies(movies);
        })
        .catch(() => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setInterestReleaseMovies([]);
        })
        .finally(() => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setReleaseLoading(false);
        });

      loadInterestContentMovies(
        interestSignals,
        user?.preferences ?? {},
        new Set(excludedMovieIds),
      )
        .then((movies) => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setInterestMovies(movies);
        })
        .catch(() => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setInterestMovies([]);
        })
        .finally(() => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setInterestLoading(false);
        });

      getPersonalSelection(recentHistory)
        .then((result) => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setPersonalSelectionMovies(result.items ?? []);
        })
        .catch(() => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setPersonalSelectionMovies([]);
        })
        .finally(() => {
          if (lastHomeRequestKeyRef.current !== preferencesRequestKey) return;
          setPersonalSelectionLoading(false);
        });
    };
    hydrateHomePage();
  }, [
    user?.id,
    preferencesRequestKey,
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

  const isHomeDataLoading =
    profileLoading ||
    releaseLoading ||
    interestLoading ||
    personalSelectionLoading;

  useEffect(() => {
    setRouteProgressLoading(isHomeDataLoading);

    return () => {
      setRouteProgressLoading(false);
    };
  }, [isHomeDataLoading]);

  return (
    <main className="min-h-screen relative bg-[#0a0a0f] text-white">
      <div className={`pointer-events-none inset-0 overflow-hidden ${!releaseLoading ? "absolute" : "hidden"}`}>
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
              "radial-gradient(circle, rgba(251, 191, 36, 0.34) 5%, rgba(244, 114, 182, 0.24) 32%, rgba(168, 85, 247, 0.08) 61%, transparent 76%)",
          }}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-350 px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-13">
          <div className="space-y-10 lg:col-span-9">
            <section>
              <div className="mb-6">
                <h1 className="text-[1rem] md:text-[1.5rem] font-semibold tracking-tight text-white/90">
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
                          matchScore: getMovieMatchScore(movie, interestWeights),
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
