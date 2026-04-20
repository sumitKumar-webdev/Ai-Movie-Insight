import { formatDate } from "@/lib/resuable-component";
import { ArrowUpRight, Clock3, Heart, MessageCircle } from "lucide-react";
import PosterFallback from "../PosterFallback/poster-fallback";
import Image from "next/image";
import { Review } from "@/app/models/service.modal";
import { useState } from "react";
import Link from "next/link";
import ExpandableText from "../ExpandableText/ExpandableText";

export function ReviewPreviewCard({
  review,
}: {
  review: Review & {
    posterUrl?: string | null;
    movieYear?: string;
    movieType?: string;
  };
}) {
  const movieTitle = review.movie?.title?.trim() || "Untitled";
  const movieHref = review.movie?.imdbId
    ? `/content/${review.movie.imdbId}`
    : "/";
  const likeCount = Number(review.likeCount ?? 0);
  const commentCount = Number(review.commentCount ?? 0);
  const movieYear = review.movieYear?.trim() || "";
  const movieType = review.movieType?.trim() || "";
  const posterUrl =
    typeof review.posterUrl === "string" &&
    review.posterUrl.trim() &&
    review.posterUrl !== "N/A"
      ? review.posterUrl
      : "";
  const [posterError, setPosterError] = useState(false);
  const hasPoster = Boolean(posterUrl) && !posterError;

  return (
    <article
      className="group block rounded-[0.95rem] border border-white/8 bg-[#0d0d0d] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-[#111111] hover:shadow-[0_16px_36px_rgba(0,0,0,0.28)] sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative mx-auto aspect-[0.7] w-full max-w-[132px] shrink-0 overflow-hidden rounded-[0.7rem] border border-white/10 bg-[#111111] sm:mx-0 sm:h-[148px] sm:w-[102px] sm:max-w-none sm:aspect-auto lg:h-[180px] lg:w-[124px]">
          {hasPoster ? (
            <Image
              unoptimized
              src={posterUrl}
              alt={`${movieTitle} poster`}
              fill
              sizes="(max-width: 640px) 132px, (max-width: 1024px) 102px, 124px"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
              onError={() => setPosterError(true)}
            />
          ) : (
            <PosterFallback title={movieTitle} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight text-white transition group-hover:text-white/92 sm:mt-3 sm:text-xl">
                {movieTitle}
              </h3>
              {(movieYear || movieType) && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                  {movieYear ? <span>{movieYear}</span> : null}
                  {movieType ? (
                    <span className="rounded-md border border-white/10 bg-[#141414] px-2 py-1 uppercase">
                      {movieType}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <Link
              href={movieHref}
              className="group/view inline-flex w-full items-center justify-center gap-1 self-start rounded-md border border-white/10 bg-[#141414] px-3 py-1.5 text-xs font-medium text-white/68 transition duration-300 hover:border-cyan-300/20 hover:bg-[#191919] hover:text-white sm:w-auto"
            >
              View movie
              <ArrowUpRight className="h-3.5 w-3.5 transition duration-300 group-hover/view:translate-x-0.5 group-hover/view:-translate-y-0.5" />
            </Link>
          </div>
          <div className="mt-3 sm:mt-2">
            <ExpandableText
              text={review.text ?? "No review text available."}
              limit={220}
            />
          </div>
          <div className="mt-5 flex gap-3 border-t border-white/6 pt-4 text-sm text-white/52 md:justify-start justify-center sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <Heart className="h-4 w-4 text-white/55" />
              {likeCount}
            </span>
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-white/55" />
              {commentCount}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-white/45" />
              {formatDate(review.date)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
