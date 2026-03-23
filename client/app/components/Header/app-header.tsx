"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Film, LogOut, Search, UserCircle2 } from "lucide-react";
import { logoutUser, useAuthStore } from "@/app/store/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import MovieResultCard from "@/app/components/cards/movie-result-card";
import MovieResultCardSkeleton from "@/app/components/skeleton-loader/movie-result-card-skeleton";
import useDebounce from "@/app/Hooks/use-debounce";
import { searchMovies } from "@/app/services/movie.service";
import { MovieSearchItem } from "@/app/modal/service.modal";
import { startRouteProgress } from "@/app/components/ui/route-progress";

export default function AppHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const authStatus = useAuthStore((auth) => auth.status);
  const user = useAuthStore((auth) => auth.user);


  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const debouncedQuery = useDebounce(normalizedQuery, 250);
  const shouldShowSuggestions = isFocused && normalizedQuery.length >= 2;

  useEffect(() => {
    if (!debouncedQuery && debouncedQuery.length >= 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await searchMovies(debouncedQuery);
        setResults(response);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLoginNavigation = () => {
    router.push("/auth/login");
  };

  const navigateToMovie = (imdbId: string) => {
    if (!imdbId) return;
    setIsFocused(false);
    setQuery("");
    setResults([]);
    startRouteProgress();
    router.push(`/content/${imdbId}`);
  };

  return (
    <>
      <header className="relative z-100 bg-black backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-white/90 transition hover:text-white"
          >
            <Film className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide sm:text-base">
              Movie Insight
            </span>
          </Link>

          <div className="flex items-start gap-3 lg:items-center">
            <div
              ref={containerRef}
              className="relative min-w-0 flex-1 lg:w-104 lg:flex-none"
            >
              <div
                className="flex h-11 cursor-text items-center rounded-full border border-white/12 bg-white/6 pl-3 pr-2"
                onClick={() => inputRef.current?.focus()}
              >
                <Search className="h-4 w-4 shrink-0 text-white/45" />
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      requestAnimationFrame(() => {
                        setIsFocused(
                          containerRef.current?.contains(
                            document.activeElement,
                          ) ?? false,
                        );
                      });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && results[0]?.imdbId) {
                        navigateToMovie(results[0].imdbId);
                      }
                    }}
                    placeholder="Search movies..."
                    className="h-full border-0 bg-transparent px-3 text-sm text-white shadow-none placeholder:text-white/35 focus-visible:ring-0"
                  />
                </div>
              </div>

              {shouldShowSuggestions ? (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+0.55rem)] max-h-80 overflow-y-auto border border-white/10 bg-zinc-950/98 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl home-search-scroll"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {loading || debouncedQuery !== normalizedQuery ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((item) => (
                        <MovieResultCardSkeleton key={item} />
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    <div className="space-y-2">
                      {results.map((movie) => (
                        <MovieResultCard
                          key={movie.imdbId}
                          imdbId={movie.imdbId}
                          title={movie.title}
                          releaseYear={movie.year}
                          posterUrl={movie.poster}
                          titleType={movie.type}
                          className="bg-white/5 hover:bg-white/10"
                          onClick={() => navigateToMovie(movie.imdbId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-4 text-sm text-white/55">
                      No matching movie found.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open profile menu"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                >
                  <UserCircle2 className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                {authStatus === "authenticated" && user ? (
                  <>
                    <DropdownMenuLabel className="truncate text-xs text-white/65">
                      {user.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => void handleLogout()}
                      disabled={loggingOut}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? "Logging out..." : "Logout"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onSelect={handleLoginNavigation}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    Login
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
