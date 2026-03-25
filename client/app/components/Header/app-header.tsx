"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Search, UserCircle2, X } from "lucide-react";
import BrandWordmark from "@/app/components/brand/wordmark";
import { logoutUser, useAuthStore } from "@/app/store/store";
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

type SearchSuggestionsProps = {
  loading: boolean;
  normalizedQuery: string;
  debouncedQuery: string;
  results: MovieSearchItem[];
  onSelectMovie: (imdbId: string) => void;
  className: string;
  cardClassName: string;
};

function SearchSuggestions({
  loading,
  normalizedQuery,
  debouncedQuery,
  results,
  onSelectMovie,
  className,
  cardClassName,
}: SearchSuggestionsProps) {
  return (
    <div className={className} onMouseDown={(event) => event.preventDefault()}>
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
              className={cardClassName}
              onClick={() => onSelectMovie(movie.imdbId)}
            />
          ))}
        </div>
      ) : (
        <p className="px-3 py-4 text-sm text-white/55">No matching movie found.</p>
      )}
    </div>
  );
}

type SearchInputShellProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (query: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
  onEscape?: () => void;
  wrapperClassName: string;
};

function SearchInputShell({
  inputRef,
  query,
  setQuery,
  onFocus,
  onBlur,
  onSubmit,
  onEscape,
  wrapperClassName,
}: SearchInputShellProps) {
  return (
    <div className={wrapperClassName} onClick={() => inputRef.current?.focus()}>
      <Search className="h-4 w-4 shrink-0 text-white/45" />
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onEscape?.();
              return;
            }

            if (event.key === "Enter") {
              onSubmit();
            }
          }}
          placeholder="Search movies..."
          className="h-full border-0 bg-transparent px-3 text-sm text-white shadow-none placeholder:text-white/35 focus-visible:ring-0"
        />   
      </div>
    </div>
  );
}

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const desktopContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [desktopSearchFocused, setDesktopSearchFocused] = useState(false);
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const authStatus = useAuthStore((auth) => auth.status);
  const user = useAuthStore((auth) => auth.user);


  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const debouncedQuery = useDebounce(normalizedQuery, 250);
  const shouldShowDesktopSuggestions =
    desktopSearchOpen && desktopSearchFocused && normalizedQuery.length >= 2;
  const shouldShowMobileSuggestions =
    mobileSearchOpen && mobileSearchFocused && normalizedQuery.length >= 2;
  const isDetailPage = pathname?.startsWith("/content/");

  useEffect(() => {
    if (debouncedQuery.length < 2) {
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

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const frame = requestAnimationFrame(() => mobileInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!desktopSearchOpen) return;
    const frame = requestAnimationFrame(() => desktopInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [desktopSearchOpen]);

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
    setDesktopSearchFocused(false);
    setMobileSearchFocused(false);
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
    setResults([]);
    startRouteProgress();
    router.push(`/content/${imdbId}`);
  };

  const navigateToFirstResult = () => {
    if (results[0]?.imdbId) {
      navigateToMovie(results[0].imdbId);
    }
  };

  const syncDesktopFocusState = () => {
    requestAnimationFrame(() => {
      setDesktopSearchFocused(
        desktopContainerRef.current?.contains(document.activeElement) ?? false,
      );
    });
  };

  const syncMobileFocusState = () => {
    requestAnimationFrame(() => {
      setMobileSearchFocused(
        mobileContainerRef.current?.contains(document.activeElement) ?? false,
      );
    });
  };

  return (
    <>
      <header className="relative z-220 isolate border-b border-white/8 bg-black/95 backdrop-blur-xl">
        <div
          className={`mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 ${
            isDetailPage
              ? "items-center justify-between"
              : "justify-between lg:flex-row lg:justify-between"
          }`}
        >
          <Link
            href="/"
            className={`inline-flex items-center rounded-md px-2 py-1 text-white/90 transition hover:text-white ${
              isDetailPage ? "hidden sm:inline-flex" : ""
            }`}
          >
            <BrandWordmark compact />
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-2 sm:flex-1 sm:gap-3 md:flex-none">
            <div
              ref={desktopContainerRef}
              className={`relative hidden min-w-0 items-center gap-3 sm:flex ${
                isDetailPage ? "flex-1 justify-end" : ""
              }`}
            >
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  desktopSearchOpen
                    ? isDetailPage
                      ? "w-94 md:w-120 opacity-100"
                      : "w-104 opacity-100"
                    : "w-0 opacity-0 pointer-events-none"
                }`}
              >
                <SearchInputShell
                  inputRef={desktopInputRef}
                  query={query}
                  setQuery={setQuery}
                  onFocus={() => setDesktopSearchFocused(true)}
                  onBlur={syncDesktopFocusState}
                  onSubmit={navigateToFirstResult}
                  onEscape={() => {
                    setDesktopSearchFocused(false);
                    setDesktopSearchOpen(false);
                  }}
                  wrapperClassName="flex h-11 cursor-text items-center rounded-full border border-white/12 bg-[#0b0b0b] pl-3 pr-2 shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
                />

                {shouldShowDesktopSuggestions ? (
                  <SearchSuggestions
                    loading={loading}
                    normalizedQuery={normalizedQuery}
                    debouncedQuery={debouncedQuery}
                    results={results}
                    onSelectMovie={navigateToMovie}
                    className="absolute right-0 top-[calc(100%+0.55rem)] z-260 max-h-80 w-full overflow-y-auto rounded-[1.4rem] border border-white/10 bg-[#050505] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.72)] home-search-scroll"
                    cardClassName="bg-[#101010] hover:bg-[#171717]"
                  />
                ) : null}
              </div>

              <button
                type="button"
                aria-label={desktopSearchOpen ? "Close search" : "Open search"}
                onClick={() => {
                  if (desktopSearchOpen) {
                    setDesktopSearchFocused(false);
                    setDesktopSearchOpen(false);
                    return;
                  }

                  setDesktopSearchOpen(true);
                  setDesktopSearchFocused(true);
                }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              >
                {desktopSearchOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            </div>

            <button
              type="button"
              aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              onClick={() => {
                setMobileSearchOpen((open) => {
                  const nextOpen = !open;
                  setMobileSearchFocused(nextOpen);
                  return nextOpen;
                });
              }}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 sm:hidden"
            >
              {mobileSearchOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>

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

              <DropdownMenuContent align="end" className="w-44 z-230">
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

        <div
          className={`overflow-hidden border-white/8 transition-all duration-300 ease-out sm:hidden ${
            mobileSearchOpen
              ? "max-h-104 overflow-visible border-t pb-3 opacity-100"
              : "max-h-0 border-t-0 pb-0 opacity-0"
          }`}
        >
          <div
            ref={mobileContainerRef}
            className={`relative mx-auto max-w-7xl px-4 pt-3 transition-transform duration-300 ease-out ${
              mobileSearchOpen ? "translate-y-0" : "-translate-y-3"
            }`}
          >
            <SearchInputShell
              inputRef={mobileInputRef}
              query={query}
              setQuery={setQuery}
              onFocus={() => setMobileSearchFocused(true)}
              onBlur={syncMobileFocusState}
              onSubmit={navigateToFirstResult}
              wrapperClassName="flex h-11 cursor-text items-center rounded-full border border-white/12 bg-white/6 pl-3 pr-2"
            />

            {shouldShowMobileSuggestions ? (
              <SearchSuggestions
                loading={loading}
                normalizedQuery={normalizedQuery}
                debouncedQuery={debouncedQuery}
                results={results}
                onSelectMovie={navigateToMovie}
                className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-230 max-h-80 overflow-y-auto rounded-none border-y border-white/10 bg-[#050505] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.72)] home-search-scroll sm:rounded-4xl"
                cardClassName="bg-[#101010] hover:bg-[#171717]"
              />
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
