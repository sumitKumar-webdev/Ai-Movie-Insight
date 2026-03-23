import PosterFallback from "@/app/components/PosterFallback/poster-fallback";
import { Skeleton } from "@/app/components/ui/skeleton";
import { MovieInsight } from "@/app/modal/service.modal";
import { formatLabel } from "@/lib/resuable-component";
import { Star } from "lucide-react";
import Image from "next/image";

type InfoSectionProps = {
  loading: boolean;
  movie: MovieInsight | null;
};

const InfoSection = ({ loading, movie }: InfoSectionProps) => {
  const metaData = [formatLabel(movie?.type ?? ""), movie?.year, movie?.runtime]
    .filter(Boolean)
    .join(" • ");

  return (
    <section className="relative min-h-110 overflow-hidden border-b border-white/10 sm:min-h-130 md:h-[78vh] md:min-h-155">
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
            className="absolute inset-0 object-cover opacity-75"
          />
        )
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.72))]" />
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-7xl px-4 pb-6 md:px-6 md:pb-10">
          <div className="grid grid-cols-[120px_1fr] items-end gap-4 sm:grid-cols-[170px_1fr] sm:gap-5 md:grid-cols-[260px_1fr] md:gap-6">
            {loading ? (
              <Skeleton className="h-45 w-30 rounded-xl bg-white/12 sm:h-62.5 sm:w-42.5 md:h-85 md:w-60 md:rounded-2xl" />
            ) : movie?.poster && movie.poster !== "N/A" ? (
              <Image
                src={movie.poster}
                alt={movie.title ?? ""}
                width={260}
                height={320}
                sizes="(max-width: 768px) 220px, 260px"
                className="h-45 w-30 rounded-xl border border-white/20 object-cover shadow-[0_25px_55px_rgba(0,0,0,0.55)] sm:h-62.5 sm:w-42.5 md:h-85 md:w-60 md:rounded-2xl"
              />
            ) : (
              <div className="h-45 w-30 overflow-hidden rounded-xl border border-white/20 shadow-[0_25px_55px_rgba(0,0,0,0.55)] sm:h-62.5 sm:w-42.5 md:h-85 md:w-60 md:rounded-2xl">
                <PosterFallback title={movie?.title} />
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <div>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-34 bg-white/12 sm:h-4 sm:w-44" />
                    <Skeleton className="h-7 w-42 bg-white/15 sm:h-10 sm:w-64 md:h-12 md:w-80" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-white/65 sm:text-sm">
                      {metaData}
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold leading-tight sm:mt-2 sm:text-4xl md:text-5xl">
                      {movie?.title}
                    </h1>
                  </>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4 md:gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="space-y-2">
                      <Skeleton className="h-3 w-16 bg-white/12" />
                      <Skeleton className="h-4 w-20 bg-white/15" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-white/80 sm:text-sm md:grid-cols-4 md:gap-4">
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
                    <p className="mt-1 flex items-center gap-1 font-medium">
                      <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                      {movie?.rating}
                    </p>
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
