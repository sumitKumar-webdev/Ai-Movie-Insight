"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import PosterFallback from "@/app/components/PosterFallback/poster-fallback";
import AnimatedBackdropFallback from "@/app/components/ui/animated-backdrop-fallback";
import PosterPreviewModal from "@/app/components/ui/poster-preview-modal";
import {
  startRouteProgress,
  setRouteProgressLoading,
} from "@/app/components/ui/route-progress";
import HoverMarqueeText from "@/app/components/ui/hover-marquee-text";
import MetaValueList from "@/app/components/ui/meta-value-list";
import { NameFilmographyItem, NameProfile } from "@/app/models/service.modal";
import { getNameById, getNameFilmography } from "@/app/services/name.service";
import { formatLabel } from "@/lib/resuable-component";
import ExpandableText from "@/app/components/ExpandableText/ExpandableText";

const LOAD_MORE_THROTTLE_MS = 450;

function getFilmographyPageSize(width: number) {
  if (width >= 1280) {
    return 10;
  }

  if (width >= 1024) {
    return 12;
  }

  if (width >= 768) {
    return 9;
  }

  return 10;
}

function mergeFilmographyItems(items: NameFilmographyItem[]) {
  const merged = new Map<string, NameFilmographyItem>();

  for (const item of items) {
    const existing = merged.get(item.title.imdbId);
    if (!existing) {
      merged.set(item.title.imdbId, {
        ...item,
        categories: [...item.categories],
        characters: [...item.characters],
      });
      continue;
    }

    for (const category of item.categories) {
      if (category && !existing.categories.includes(category)) {
        existing.categories.push(category);
      }
    }

    for (const character of item.characters) {
      if (character && !existing.characters.includes(character)) {
        existing.characters.push(character);
      }
    }

    if (item.episodeCount > existing.episodeCount) {
      existing.episodeCount = item.episodeCount;
    }
  }

  return Array.from(merged.values());
}

function PersonHero({
  loading,
  person,
}: {
  loading: boolean;
  person: NameProfile | null;
}) {
  const [loadedImageSrc, setLoadedImageSrc] = useState("");
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const hasBackdrop = Boolean(person?.backdrop);
  const photoUrl = person?.photo ?? "";
  const hasPhoto = Boolean(photoUrl);
  const canPreviewPhoto = !loading && hasPhoto;
  const metaText = [
    person?.professions.length
      ? person.professions.map(formatLabel).join(" â€¢ ")
      : "",
    person?.isDeceased ? "Deceased" : "",
  ]
    .filter(Boolean)
    .join(" â€¢ ");

  return (
    <section className="relative overflow-hidden border-b border-white/10 min-h-100 sm:min-h-144 md:h-[78vh] md:min-h-155">
      {loading ? (
        <Skeleton className="absolute inset-0 rounded-none bg-white/10" />
      ) : hasBackdrop ? (
        <Image unoptimized
          src={person?.backdrop ?? ""}
          alt=""
          fill
          priority
          sizes="100vw"
          onLoad={() => setLoadedImageSrc(person?.backdrop ?? "")}
          className={`absolute inset-0 object-cover object-top transition-opacity duration-700 ${
            loadedImageSrc === person?.backdrop ? "opacity-30" : "opacity-0"
          }`}
        />
      ) : (
        <AnimatedBackdropFallback className="absolute inset-0" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.1)_16%,rgba(0,0,0,0.34)_42%,rgba(0,0,0,0.8)_72%,rgba(0,0,0,1)_100%)] md:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.72))]" />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-7xl -translate-y-8 px-4 pb-3 sm:-translate-y-10 sm:px-5 sm:pb-4 md:translate-y-0 md:px-6 md:pb-10">
          <div className="grid grid-cols-[112px_1fr] items-end gap-4 sm:grid-cols-[140px_1fr] sm:gap-5 md:grid-cols-[260px_1fr] md:gap-6">
            <div>
              {loading ? (
                <Skeleton className="h-50 w-28 rounded-[1.35rem] bg-white/12 sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl" />
              ) : canPreviewPhoto ? (
                <button
                  type="button"
                  onClick={() => setPhotoPreviewOpen(true)}
                  className="group relative h-50 w-28 overflow-hidden rounded-[1.35rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.52)] transition duration-300 hover:shadow-[0_28px_70px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl md:border-white/20 md:shadow-[0_25px_55px_rgba(0,0,0,0.55)]"
                >
                  <Image unoptimized
                    src={photoUrl}
                    alt={person?.name ?? ""}
                    width={260}
                    height={320}
                    sizes="(max-width: 768px) 220px, 260px"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-black/0 transition group-hover:bg-black/25 md:rounded-2xl" />
                  <div className="pointer-events-none absolute inset-x-3 bottom-2 text-[10px] font-medium text-white/90 opacity-0 transition group-hover:opacity-100 sm:text-xs">
                    Click to view
                  </div>
                </button>
              ) : (
                <div className="h-50 w-28 overflow-hidden rounded-[1.35rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.52)] sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl md:border-white/20 md:shadow-[0_25px_55px_rgba(0,0,0,0.55)]">
                  <PosterFallback title={person?.name || "Photo unavailable"} />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-3 sm:space-y-4 md:space-y-5">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28 bg-white/12 sm:h-4 sm:w-44" />
                  <Skeleton className="h-7 w-34 bg-white/15 sm:h-10 sm:w-64 md:h-12 md:w-80" />
                  <Skeleton className="h-3 w-32 bg-white/12 sm:h-4 sm:w-44" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {person?.isDeceased ? (
                      <Badge className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/80 sm:px-3 sm:text-xs">
                        In memory
                      </Badge>
                    ) : null}
                  </div>
                  {metaText ? (
                    <p className="overflow-x-auto whitespace-nowrap text-[11px] leading-4 text-white/65 [scrollbar-width:none] sm:text-sm">
                      {metaText}
                    </p>
                  ) : null}
                  <h1 className="max-w-44 text-[1.75rem] font-semibold leading-[1.03] tracking-[-0.03em] text-white sm:max-w-none sm:text-3xl md:text-4xl">
                    {person?.name}
                  </h1>
                </>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] leading-4 text-white/80 sm:text-sm md:grid-cols-4 md:gap-4">
                {loading ? (
                  [1, 2, 3, 4].map((item) => (
                    <div key={item} className="space-y-2">
                      <Skeleton className="h-3 w-16 bg-white/12" />
                      <Skeleton className="h-4 w-24 bg-white/15" />
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <p className="text-white/50">Born</p>
                      <p className="mt-1 font-medium">
                        {person?.birthDate || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/50">Birthplace</p>
                      <p className="mt-1 font-medium">
                        {person?.birthLocation || "Unknown"}
                      </p>
                    </div>
                    {person?.isDeceased && (
                      <div>
                        <p className="text-white/50">
                          {person?.isDeceased ? "Died" : "Status"}
                        </p>
                        <p className="mt-1 font-medium">
                          {person?.isDeceased
                            ? person?.deathDate || "Unknown"
                            : "Living"}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-white/50">Profession</p>
                      <MetaValueList
                        values={person?.professions ?? []}
                        label="professions"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {canPreviewPhoto ? (
        <PosterPreviewModal
          open={photoPreviewOpen}
          onOpenChange={setPhotoPreviewOpen}
          imageUrl={photoUrl}
          title={person?.name ?? ""}
        />
      ) : null}
    </section>
  );
}

function FilmographyCard({ item }: { item: NameFilmographyItem }) {
  const router = useRouter();
  const [posterError, setPosterError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasPoster = Boolean(item.title.poster) && !posterError;
  const roleText = item.categories.length
    ? item.categories.map(formatLabel).join(", ")
    : formatLabel(item.title.type);
  const characterText = item.characters.length
    ? item.characters.map(formatLabel).join(", ")
    : "";
  const titleWithYear = `${item.title.title} (${item.title.year}${item.title.endYear ? ` - ${item.title.endYear}` : ""})`;

  return (
    <button
      type="button"
      onClick={() => {
        startRouteProgress();
        router.push(`/content/${item.title.imdbId}`);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className="group overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(16,21,30,0.98),rgba(9,13,19,0.99))] text-left transition-all duration-300 hover:border-cyan-300/20 hover:bg-[linear-gradient(180deg,rgba(20,27,38,0.99),rgba(11,16,24,1))] hover:shadow-[0_24px_55px_rgba(0,0,0,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
    >
      <div className="relative aspect-[0.72] overflow-hidden bg-[#101014]">
        {hasPoster ? (
          <Image unoptimized
            src={item.title.poster ?? ""}
            alt={item.title.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            onError={() => setPosterError(true)}
          />
        ) : (
          <PosterFallback title={item.title.title} />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-transparent" />
        <div className="absolute left-3 top-3">
          <Badge className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] text-white/90">
            {formatLabel(item.title.type)}
          </Badge>
        </div>
      </div>

      <div className="px-4 py-2">
        <div>
          <div className="overflow-hidden">
            <h3 className="text-base font-semibold text-white transition-colors duration-300 group-hover:text-cyan-100">
              <HoverMarqueeText
                text={titleWithYear}
                hoverActive={isHovered}
                className="text-base font-semibold leading-6"
                wrapperClassName="h-6 w-full"
              />
            </h3>
          </div>
        </div>

        <div className="space-y-1.5">
          {(roleText !== "Actor" && roleText !== "Self") && (
            <p className="line-clamp-2 text-sm font-medium text-white/78">
              {roleText}
            </p>
          )}
          {characterText ? (
            <div className="overflow-hidden">
              <HoverMarqueeText
                text={characterText}
                hoverActive={isHovered}
                className="text-xs text-white/55 leading-6"
                wrapperClassName="h-6 w-full"
              />
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function FilmographySkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/4">
      <Skeleton className="aspect-[0.72] w-full rounded-none bg-white/10" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4 bg-white/12" />
        <Skeleton className="h-4 w-1/2 bg-white/10" />
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-1/3 bg-white/10" />
      </div>
    </div>
  );
}

export default function NameInsightPage() {
  const params = useParams<{ nameId: string }>();
  const nameId = Array.isArray(params.nameId)
    ? (params.nameId[0] ?? "")
    : (params.nameId ?? "");

  const [person, setPerson] = useState<NameProfile | null>(null);
  const [personLoading, setPersonLoading] = useState(true);
  const [personError, setPersonError] = useState<string | null>(null);

  const [filmography, setFilmography] = useState<NameFilmographyItem[]>([]);
  const [filmographyLoading, setFilmographyLoading] = useState(true);
  const [filmographyError, setFilmographyError] = useState<string | null>(null);
  const [filmographyTotal, setFilmographyTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined,
  );
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [filmographyPageSize, setFilmographyPageSize] = useState(() =>
    typeof window === "undefined" ? 10 : getFilmographyPageSize(window.innerWidth),
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const throttleTimeoutRef = useRef<number | null>(null);
  const lastLoadMoreAtRef = useRef(0);

  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        window.clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateFilmographyPageSize = () => {
      const nextPageSize = getFilmographyPageSize(window.innerWidth);
      setFilmographyPageSize((current) =>
        current === nextPageSize ? current : nextPageSize,
      );
    };

    updateFilmographyPageSize();
    window.addEventListener("resize", updateFilmographyPageSize);

    return () => {
      window.removeEventListener("resize", updateFilmographyPageSize);
    };
  }, []);

  useEffect(() => {
    const loadPerson = async () => {
      if (!nameId) {
        setPersonLoading(false);
        return;
      }

      setPersonLoading(true);
      setPersonError(null);

      try {
        const data = await getNameById(nameId);
        setPerson(data);
      } catch (error) {
        setPersonError(
          error instanceof Error ? error.message : "Failed to fetch person",
        );
      } finally {
        setPersonLoading(false);
      }
    };
    loadPerson();
  }, [nameId]);

  useEffect(() => {
    const loadFirstPage = async () => {
      if (!nameId) {
        setFilmographyLoading(false);
        return;
      }

      setFilmographyLoading(true);
      setFilmographyError(null);
      setFilmography([]);
      setNextPageToken(undefined);
      setFilmographyTotal(0);

      try {
        const data = await getNameFilmography(nameId, {
          pageSize: filmographyPageSize,
        });

        setFilmography(mergeFilmographyItems(data.credits));
        setFilmographyTotal(data.totalCount);
        setNextPageToken(data.nextPageToken);
      } catch (error) {
        setFilmographyError(
          error instanceof Error
            ? error.message
            : "Failed to fetch filmography",
        );
      } finally {
        setFilmographyLoading(false);
      }
    };
    loadFirstPage();
  }, [filmographyPageSize, nameId]);

  useEffect(() => {
    setRouteProgressLoading(personLoading || filmographyLoading);
  }, [personLoading, filmographyLoading]);

  useEffect(() => {
    if (!sentinelRef.current || !nextPageToken || filmographyLoading) {
      return;
    }

    const loadMore = async () => {
      if (!nextPageToken || isFetchingMore) {
        return;
      }

      setIsFetchingMore(true);
      setFilmographyError(null);
      lastLoadMoreAtRef.current = Date.now();

      try {
        const data = await getNameFilmography(nameId, {
          pageSize: filmographyPageSize,
          pageToken: nextPageToken,
        });

        setFilmography((current) =>
          mergeFilmographyItems([...current, ...data.credits]),
        );
        setFilmographyTotal(data.totalCount);
        setNextPageToken(data.nextPageToken);
      } catch (error) {
        setFilmographyError(
          error instanceof Error
            ? error.message
            : "Failed to fetch more filmography",
        );
      } finally {
        setIsFetchingMore(false);
      }
    };

    const scheduleLoadMore = () => {
      if (!nextPageToken || isFetchingMore) {
        return;
      }

      const waitTime = Math.max(
        0,
        LOAD_MORE_THROTTLE_MS - (Date.now() - lastLoadMoreAtRef.current),
      );

      if (throttleTimeoutRef.current) {
        window.clearTimeout(throttleTimeoutRef.current);
      }

      throttleTimeoutRef.current = window.setTimeout(() => {
        throttleTimeoutRef.current = null;
        void loadMore();
      }, waitTime);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          scheduleLoadMore();
        }
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [
    filmographyLoading,
    filmographyPageSize,
    isFetchingMore,
    nameId,
    nextPageToken,
  ]);

  if (personError) {
    return (
      <main className="min-h-screen bg-black px-4 py-12 text-white md:px-6">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center">
          <div className="w-full rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-rose-200 sm:text-2xl">
              Unable to Load Person
            </h2>
            <p className="mt-3 text-sm leading-7 text-rose-200/90 sm:text-base">
              {personError}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <PersonHero loading={personLoading} person={person} />

      <section className="mx-auto w-full max-w-7xl gap-6 px-2 py-8 md:px-6">
        <div className="space-y-6">
          <Card className="bg-transparent text-white border-none">
            <CardHeader>
              {personLoading ? (
                <Skeleton className="h-9 w-36 bg-white/12" />
              ) : (
                <CardTitle className="text-xl md:text-3xl">Biography</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {personLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="h-4 w-full bg-white/12" />
                  ))}
                </div>
              ) : (
                <ExpandableText
                  text={
                    person?.biography ||
                    "Biography unavailable for this person right now."
                  }
                  limit={500}
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-transparent border-none text-white">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-xl md:text-3xl">Filmography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {filmographyLoading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: filmographyPageSize }).map((_, index) => (
                    <FilmographySkeleton
                      key={`filmography-skeleton-${index}`}
                    />
                  ))}
                </div>
              ) : filmography.length ? (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {filmography.map((item) => (
                      <FilmographyCard key={item.id} item={item} />
                    ))}
                  </div>

                  {isFetchingMore ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="inline-flex items-center gap-3 text-sm text-white/70">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
                        <span>Loading more titles...</span>
                      </div>
                    </div>
                  ) : null}

                  <div ref={sentinelRef} className="h-4 w-full" />

                  {!nextPageToken && !isFetchingMore ? (
                    <p className="text-center text-sm text-white/45">
                      End of filmography
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-center text-base text-white/60">
                  No filmography available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}


