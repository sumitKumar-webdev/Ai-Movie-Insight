"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import MovieResultCard from "@/app/components/cards/movie-result-card";
import BrandWordmark from "@/app/components/brand/wordmark";
import useDebounce from "@/app/Hooks/use-debounce";
import MovieResultCardSkeleton from "./components/skeleton-loader/movie-result-card-skeleton";
import { MovieSearchItem } from "./modal/service.modal";
import { searchMovies } from "./services/movie.service";
import { PosterRail } from "./components/poster rail/poster-rail";
import { brand } from "./config/brand";

const leftPosters = [
  "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
  "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
  "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
];

const rightPosters = [
  "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
  "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
  "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
  "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
  "https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg",
  "https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const debouncedQuery = useDebounce(normalizedQuery, 400);

  useEffect(() => {
    if (debouncedQuery.length < 4) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await searchMovies(debouncedQuery, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setResults(response);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMovies();
    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const navigateToMovie = (imdbId: string) => {
    if (!imdbId) return;
    router.push(`/content/${imdbId}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(110,168,254,0.14),transparent_28%),linear-gradient(to_bottom,#060606,#080b14)]" />

      <section className="relative mx-auto flex min-h-screen items-center justify-center px-10 overflow-hidden">
        <div className="md:w-[42%] w-full flex items-center justify-center gap-5">
          <PosterRail posters={leftPosters} />
          <PosterRail posters={rightPosters} reverse />
        </div>
        <div className="absolute md:relative md:mx-auto px-2 sm:px-4 md:px-6 w-full md:max-w-2xl lg:ml-auto lg:w-[58%]">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,16,24,0.88),rgba(6,8,14,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8">
            <div className="mb-5">
              <BrandWordmark
                titleClassName="text-2xl md:text-4xl leading-none"
                subtitleClassName="text-[8px] md:text-xs"
              />
            </div>
            <p className="mb-3 text-xs font-medium tracking-[0.24em] text-white/55 uppercase">
              {brand.homepageEyebrow}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-3xl">
              {brand.homepageTitle}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              {brand.homepageDescription}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && results[0]?.imdbId) {
                    navigateToMovie(results[0].imdbId);
                  }
                }}
                placeholder="Enter movie name (e.g. Inception)"
                className="h-12 border-white/15 bg-black/45 text-white placeholder:text-white/45"
              />
              <Button
                className="h-12 rounded-xl bg-[linear-gradient(135deg,#f8fafc,#e8eef7)] text-slate-950 shadow-none hover:bg-[#f4f7fb]"
                onClick={() => {
                  if (results[0]?.imdbId) {
                    navigateToMovie(results[0].imdbId);
                  }
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {normalizedQuery.length >= 4 && (
              <div className="home-search-scroll mt-4 max-h-72 space-y-2 overflow-y-auto pb-3 pr-1">
                {loading || debouncedQuery !== normalizedQuery ? (
                  [1, 2, 3].map((item) => (
                    <MovieResultCardSkeleton key={item} />
                  ))
                ) : results.length > 0 ? (
                  results.map((movie) => (
                    <MovieResultCard
                      key={movie.imdbId}
                      imdbId={movie.imdbId}
                      title={movie.title}
                      releaseYear={movie.year}
                      posterUrl={movie.poster}
                      titleType={movie.type}
                      className="border-white/10 bg-[linear-gradient(180deg,rgba(18,24,34,0.96),rgba(11,15,22,0.98))] shadow-none hover:bg-[linear-gradient(180deg,rgba(24,31,43,0.98),rgba(14,20,29,0.99))]"
                      onClick={() => navigateToMovie(movie.imdbId)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-white/65">
                     No matching movie found.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
