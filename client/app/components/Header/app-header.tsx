"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Film, Search, UserRound, X } from "lucide-react";
import BrandWordmark from "@/app/components/brand/wordmark";
import { Input } from "@/app/components/ui/input";
import CompactMovieCard from "@/app/components/cards/compact-movie-card";
import CompactUserCard from "@/app/components/cards/compact-user-card";
import MovieResultCardSkeleton from "@/app/components/skeleton-loader/movie-result-card-skeleton";
import UserResultCardSkeleton from "@/app/components/skeleton-loader/user-result-card-skeleton";
import useDebounce from "@/app/Hooks/use-debounce";
import { searchMovies } from "@/app/services/movie.service";
import { PublicProfileUser } from "@/app/store/auth-slice";
import { MovieSearchItem } from "@/app/models/service.modal";
import { startRouteProgress } from "@/app/components/ui/route-progress";
import HeaderProfileMenu from "@/app/components/Header/header-profile-menu";
import { saveSelectedMovieToSearchHistory } from "@/lib/saveToStorage/search-selection-history";
import { searchPublicProfiles } from "@/app/services/auth.service";
import { getProfileHref } from "@/lib/profile";

type SearchScope = "content" | "users";

type SearchSuggestionsProps = {
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  loading: boolean;
  normalizedQuery: string;
  debouncedQuery: string;
  movieResults: MovieSearchItem[];
  userResults: PublicProfileUser[];
  onSelectMovie: (movie: MovieSearchItem) => void;
  onSelectUser: (user: PublicProfileUser) => void;
  className: string;
  cardClassName: string;
};

function SearchScopeSwitch({
  scope,
  onScopeChange,
}: {
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
}) {
  const options: Array<{
    value: SearchScope;
    label: string;
    icon: typeof Film;
  }> = [
    { value: "content", label: "Movies", icon: Film },
    { value: "users", label: "Users", icon: UserRound },
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 rounded-[1.1rem] border border-white/8 bg-[#0b0b0b] p-1.5">
      {options.map((option) => {
        const Icon = option.icon;
        const active = scope === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onScopeChange(option.value)}
            className={`inline-flex min-h-9 md:min-h-10 items-center justify-center gap-2 rounded-[0.9rem] px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium transition ${
              active
                ? "bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.12)]"
                : "text-white/62 hover:bg-white/6 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SearchSuggestions({
  scope,
  onScopeChange,
  loading,
  normalizedQuery,
  debouncedQuery,
  movieResults,
  userResults,
  onSelectMovie,
  onSelectUser,
  className,
  cardClassName,
}: SearchSuggestionsProps) {
  const minQueryLength = 2;
  const showLoading = loading || debouncedQuery !== normalizedQuery;

  return (
    <div className={className} onMouseDown={(event) => event.preventDefault()}>
      <SearchScopeSwitch scope={scope} onScopeChange={onScopeChange} />
      {normalizedQuery.length < minQueryLength ? (
        <div className="rounded-[1.15rem] border border-dashed border-white/10 bg-[#0b0b0b] px-4 py-5 text-sm text-white/52">
          Type at least {minQueryLength} characters to search{" "}
          {scope === "content" ? "movies" : "users"}.
        </div>
      ) : showLoading ? (
        <div className="space-y-2">
          {scope === "content"
            ? [1, 2, 3, 4, 5].map((item) => (
                <MovieResultCardSkeleton key={item} />
              ))
            : [1, 2, 3, 4].map((item) => <UserResultCardSkeleton key={item} />)}
        </div>
      ) : scope === "content" ? (
        movieResults.length > 0 ? (
          <div className="space-y-2">
            {movieResults.map((movie) => (
              <CompactMovieCard
                key={movie.imdbId}
                movie={{
                  imdbId: movie.imdbId,
                  title: movie.title,
                  releaseYear: movie.year,
                  posterUrl: movie.poster,
                  titleType: movie.type,
                }}
                className={cardClassName}
                onClick={() => onSelectMovie(movie)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-[1.15rem] border border-white/8 bg-[#0b0b0b] px-3 py-4 text-sm text-white/55">
            No matching movie found.
          </p>
        )
      ) : (
        userResults.length > 0 ? (
          <div className="space-y-2">
            {userResults.map((user) => (
              <CompactUserCard
                key={user.id || user.username}
                user={user}
                onClick={() => onSelectUser(user)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-[1.15rem] border border-white/8 bg-[#0b0b0b] px-3 py-4 text-sm text-white/55">
            No matching user found.
          </p>
        )
      )}
    </div>
  );
}

type SearchInputShellProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  placeholder: string;
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
  placeholder,
  setQuery,
  onFocus,
  onBlur,
  onSubmit,
  onEscape,
  wrapperClassName,
}: SearchInputShellProps) {
  return (
    <div className={wrapperClassName} onClick={() => inputRef.current?.focus()}>
      <Search className="h-4 md:h-5 w-5 shrink-0 text-white/45" />
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
          placeholder={placeholder}
          className="h-full border-0 bg-transparent px-3 text-sm text-white shadow-none placeholder:text-white/35 focus-visible:ring-0"
        />   
      </div>
    </div>
  );
}

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const desktopContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("content");
  const [movieResults, setMovieResults] = useState<MovieSearchItem[]>([]);
  const [userResults, setUserResults] = useState<PublicProfileUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [desktopSearchFocused, setDesktopSearchFocused] = useState(false);
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const debouncedQuery = useDebounce(normalizedQuery, 400);
  const shouldShowDesktopSuggestions =
    desktopSearchOpen && desktopSearchFocused;
  const shouldShowMobileSuggestions =
    mobileSearchOpen && mobileSearchFocused;
  const isDetailPage = pathname?.startsWith("/content/");
  const minQueryLength = 2;
  const shouldSearch = normalizedQuery.length >= minQueryLength
    && (desktopSearchOpen || mobileSearchOpen);

  useEffect(() => {
    if (!shouldSearch || debouncedQuery.length < minQueryLength) {
      if (searchScope === "content") {
        setMovieResults([]);
      } else {
        setUserResults([]);
      }
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const fetchResults = async () => {
      try {
        setLoading(true);
        if (searchScope === "content") {
          const response = await searchMovies(debouncedQuery, {
            signal: controller.signal,
          });
          if (!controller.signal.aborted) {
            setMovieResults(response);
          }
          return;
        }

        const response = await searchPublicProfiles(debouncedQuery);
        if (!controller.signal.aborted) {
          setUserResults(response.users);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchResults();
    return () => {
      controller.abort();
    };
  }, [debouncedQuery, minQueryLength, searchScope, shouldSearch]);

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

  const blurActiveElement = () => {
    if (typeof document === "undefined") return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  };

  const navigateTo = (href: string) => {
    blurActiveElement();
    requestAnimationFrame(() => {
      router.push(href);
    });
  };

  const navigateToMovie = (movie?: MovieSearchItem) => {
    if (!movie?.imdbId) return;
    setDesktopSearchFocused(false);
    setMobileSearchFocused(false);
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
    setMovieResults([]);
    setUserResults([]);
    saveSelectedMovieToSearchHistory(movie);
    startRouteProgress();
    navigateTo(`/content/${movie.imdbId}`);
  };

  const navigateToUser = (user?: PublicProfileUser) => {
    if (!user?.username) return;
    setDesktopSearchFocused(false);
    setMobileSearchFocused(false);
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
    setMovieResults([]);
    setUserResults([]);
    startRouteProgress();
    navigateTo(getProfileHref(user.username));
  };

  const navigateToFirstResult = () => {
    if (searchScope === "content") {
      if (movieResults[0]) {
        navigateToMovie(movieResults[0]);
      }
      return;
    }

    if (userResults[0]) {
      navigateToUser(userResults[0]);
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
          className={`mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-6 sm:py-2 ${
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
            <BrandWordmark compact/>
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:flex-1 sm:gap-3 md:flex-none">
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
                  placeholder={
                    searchScope === "content"
                      ? "Search movies..."
                      : "Search users..."
                  }
                  setQuery={setQuery}
                  onFocus={() => setDesktopSearchFocused(true)}
                  onBlur={syncDesktopFocusState}
                  onSubmit={navigateToFirstResult}
                  onEscape={() => {
                    setDesktopSearchFocused(false);
                    setDesktopSearchOpen(false);
                  }}
                  wrapperClassName="flex h-12 cursor-text items-center rounded-full border border-white/12 bg-[#0b0b0b] pl-3 pr-2 shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
                />

                {shouldShowDesktopSuggestions && (
                  <SearchSuggestions
                    scope={searchScope}
                    onScopeChange={setSearchScope}
                    loading={loading}
                    normalizedQuery={normalizedQuery}
                    debouncedQuery={debouncedQuery}
                    movieResults={movieResults}
                    userResults={userResults}
                    onSelectMovie={navigateToMovie}
                    onSelectUser={navigateToUser}
                    className="absolute right-0 top-[calc(100%+0.55rem)] z-260 max-h-80 w-full overflow-y-auto rounded-[1.4rem] border border-white/10 bg-[#050505] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.72)] home-search-scroll"
                    cardClassName="bg-[#101010] hover:bg-[#171717]"
                  />
                )}
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
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 sm:hidden"
            >
              {mobileSearchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>

            <HeaderProfileMenu
              triggerClassName="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 sm:h-10 sm:w-10"
              avatarClassName="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
              menuClassName="z-230 w-44"
            />
          </div>
        </div>

        <div
          className={`overflow-hidden border-white/8 transition-all duration-300 ease-out sm:hidden ${
            mobileSearchOpen
              ? "max-h-104 overflow-visible border-t pb-2.5 opacity-100"
              : "max-h-0 border-t-0 pb-0 opacity-0"
          }`}
        >
          <div
            ref={mobileContainerRef}
            className={`relative mx-auto max-w-7xl px-3 pt-2.5 transition-transform duration-300 ease-out ${
              mobileSearchOpen ? "translate-y-0" : "-translate-y-3"
            }`}
          >
            <SearchInputShell
              inputRef={mobileInputRef}
              query={query}
              placeholder={
                searchScope === "content"
                  ? "Search movies..."
                  : "Search users..."
              }
              setQuery={setQuery}
              onFocus={() => setMobileSearchFocused(true)}
              onBlur={syncMobileFocusState}
              onSubmit={navigateToFirstResult}
              wrapperClassName="flex h-12 cursor-text items-center rounded-full border border-white/12 bg-white/6 pl-3 pr-2"
            />

            {shouldShowMobileSuggestions && (
              <SearchSuggestions
                scope={searchScope}
                onScopeChange={setSearchScope}
                loading={loading}
                normalizedQuery={normalizedQuery}
                debouncedQuery={debouncedQuery}
                movieResults={movieResults}
                userResults={userResults}
                onSelectMovie={navigateToMovie}
                onSelectUser={navigateToUser}
                className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-230 max-h-80 overflow-y-auto rounded-none border-y border-white/10 bg-[#050505] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.72)] home-search-scroll sm:rounded-4xl"
                cardClassName="bg-[#101010] hover:bg-[#171717]"
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
