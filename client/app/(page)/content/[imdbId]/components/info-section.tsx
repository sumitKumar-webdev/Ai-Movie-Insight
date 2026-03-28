import PosterFallback from "@/app/components/PosterFallback/poster-fallback";
import CompactCount from "@/app/components/ui/compact-count";
import { Skeleton } from "@/app/components/ui/skeleton";
import { MovieDetails } from "@/app/modal/service.modal";
import { formatLabel } from "@/lib/resuable-component";
import { Star } from "lucide-react";
import Image from "next/image";

type InfoSectionProps = {
  loading: boolean;
  movie: MovieDetails | null;
};

const InfoSection = ({ loading, movie }: InfoSectionProps) => {
  const metaData = [formatLabel(movie?.type ?? ""), movie?.year, movie?.runtime]
    .filter(Boolean)
    .join(" • ");

  return (
    <section className="relative overflow-hidden border-b border-white/10 min-h-100 sm:min-h-144 md:h-[78vh] md:min-h-155">
      {loading ? (
        <Skeleton className="absolute inset-0 rounded-none bg-white/10" />
      ) : (
        movie?.backdrop && (
          <Image
            src={movie.backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="h-20 absolute inset-0 object-cover object-center opacity-70 md:mt-0"
          />
        )
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.1)_16%,rgba(0,0,0,0.34)_42%,rgba(0,0,0,0.8)_72%,rgba(0,0,0,1)_100%)] md:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.72))]" />
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-7xl -translate-y-8 px-4 pb-3 sm:-translate-y-10 sm:px-5 sm:pb-4 md:translate-y-0 md:px-6 md:pb-10">
          <div className="grid grid-cols-[112px_1fr] items-end gap-4 sm:grid-cols-[140px_1fr] sm:gap-5 md:grid-cols-[260px_1fr] md:gap-6">
            {loading ? (
              <Skeleton className="h-50 w-28 rounded-[1.35rem] bg-white/12 sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl" />
            ) : movie?.poster && movie.poster !== "N/A" ? (
              <Image
                src={movie.poster}
                alt={movie.title ?? ""}
                width={260}
                height={320}
                sizes="(max-width: 768px) 220px, 260px"
                className="h-50 w-28 rounded-[1.35rem] border border-white/10 object-cover shadow-[0_24px_60px_rgba(0,0,0,0.52)] sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl md:border-white/20 md:shadow-[0_25px_55px_rgba(0,0,0,0.55)]"
              />
            ) : (
              <div className="h-50 w-28 overflow-hidden rounded-[1.35rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.52)] sm:h-56 sm:w-35 md:h-85 md:w-60 md:rounded-2xl md:border-white/20 md:shadow-[0_25px_55px_rgba(0,0,0,0.55)]">
                <PosterFallback title={movie?.title} />
              </div>
            )}

            <div className="min-w-0 space-y-3 sm:space-y-4 md:space-y-5">
              <div>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-28 bg-white/12 sm:h-4 sm:w-44" />
                    <Skeleton className="h-7 w-34 bg-white/15 sm:h-10 sm:w-64 md:h-12 md:w-80" />
                  </div>
                ) : (
                  <>
                    <p className="overflow-x-auto whitespace-nowrap text-[11px] leading-4 text-white/65 [scrollbar-width:none] sm:text-sm">
                      {metaData}
                    </p>
                    <h1 className="max-w-44 text-[1.75rem] font-semibold leading-[1.03] tracking-[-0.03em] sm:max-w-none sm:text-3xl md:text-4xl">
                      {movie?.title}
                    </h1>
                  </>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 md:grid-cols-4 md:gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="space-y-2">
                      <Skeleton className="h-3 w-16 bg-white/12" />
                      <Skeleton className="h-4 w-20 bg-white/15" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] leading-4 text-white/80 sm:text-sm md:grid-cols-4 md:gap-4">
                  <div>
                    <p className="text-white/50">Country</p>
                    <p className="mt-1 font-medium">{movie?.country}</p>
                  </div>
                  <div>
                    <p className="text-white/50">Language</p>
                    <p className="mt-1 font-medium">{movie?.language}</p>
                  </div>
                  <div>
                    <p className="text-white/50">Release Date</p>
                    <p className="mt-1 font-medium">{movie?.releaseDate}</p>
                  </div>
                  <div>
                    <p className="text-white/50">IMDb</p>
                    <div className="mt-1 space-y-1 flex gap-2">
                      <p className="flex items-center font-medium">
                        <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300 sm:h-4 sm:w-4 mr-1" />
                        {movie?.rating}<span className="text-white/60">/10</span>
                      </p>
                      <CompactCount
                        value={movie?.ratingCount}
                        suffix="reviews"
                        className="text-[10px] text-white/55 sm:text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
