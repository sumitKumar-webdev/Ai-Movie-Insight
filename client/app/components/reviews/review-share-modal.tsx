"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { ReviewShareCardPayload } from "@/app/modal/service.modal";
import { getReviewShareCard } from "@/app/services/movie.service";
import ReviewShareCard, {
  buildReviewShareCardHtml,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "./review-share-card";

type ReviewShareModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId?: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function htmlToSvgDataUrl(html: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${SHARE_CARD_WIDTH}px;height:${SHARE_CARD_HEIGHT}px;background:#090c0f;">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image data"));
    };
    reader.onerror = () => reject(new Error("Unable to read image data"));
    reader.readAsDataURL(blob);
  });
}

async function inlinePosterImage(review: ReviewShareCardPayload | null) {
  const posterUrl = review?.content?.posterUrl?.trim();
  if (!review || !posterUrl) {
    return review;
  }

  try {
    const response = await fetch(posterUrl, { cache: "force-cache" });
    if (!response.ok) {
      return review;
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);

    return {
      ...review,
      content: {
        ...review.content,
        posterUrl: dataUrl,
      },
    };
  } catch {
    return review;
  }
}

async function renderHtmlToJpegBlob(html: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = htmlToSvgDataUrl(html);

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create image canvas");
  }

  context.fillStyle = "#090c0f";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to export share card"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.95,
    );
  });
}

export default function ReviewShareModal({
  open,
  onOpenChange,
  reviewId,
}: ReviewShareModalProps) {
  const [busyAction, setBusyAction] = useState<"download" | "share" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<ReviewShareCardPayload | null>(null);
  const html = useMemo(() => buildReviewShareCardHtml(review), [review]);

  useEffect(() => {
    if (!open || !reviewId) {
      if (!open) {
        setReview(null);
        setError("");
      }
      return;
    }

    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getReviewShareCard(reviewId);
        if (ignore) {
          return;
        }

        if (!response.ok || !response.data) {
          setReview(null);
          setError(response.message ?? "Unable to load preview");
          return;
        }

        setReview(response.data);
      } catch (loadError) {
        if (!ignore) {
          setReview(null);
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load preview",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [open, reviewId]);

  const fileName = useMemo(() => {
    const movie = slugify(review?.content?.title || "cineai-review");
    const author = slugify(review?.user?.username || review?.user?.name || "user");
    return `${movie}-${author}-review.jpg`;
  }, [review]);

  const handleDownload = async () => {
    if (!review) {
      return;
    }

    try {
      setBusyAction("download");
      const exportReview = await inlinePosterImage(review);
      const exportHtml = buildReviewShareCardHtml(exportReview);
      const blob = await renderHtmlToJpegBlob(exportHtml);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download share card",
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleShare = async () => {
    if (!review) {
      return;
    }

    try {
      setBusyAction("share");
      const exportReview = await inlinePosterImage(review);
      const exportHtml = buildReviewShareCardHtml(exportReview);
      const blob = await renderHtmlToJpegBlob(exportHtml);
      const file = new File([blob], fileName, { type: "image/jpeg" });

      if (
        typeof navigator !== "undefined"
        && navigator.share
        && navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title: review?.content?.title || "CineAI Review",
          text: `Check out this review for ${review?.content?.title || "this movie"}.`,
          files: [file],
        });
        return;
      }

      await handleDownload();
    } catch (shareError) {
      if ((shareError as Error)?.name !== "AbortError") {
        setError(
          shareError instanceof Error
            ? shareError.message
            : "Unable to share share card",
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        contentWrapperClassName="overflow-hidden p-3 sm:p-4"
        className="flex h-[min(92vh,860px)] w-[min(440px,calc(100vw-1.5rem))] max-w-[440px] flex-col overflow-hidden border border-white/10 bg-[#121212] p-0 text-white"
      >
        <DialogHeader className="border-b border-white/10 px-5 py-4 text-left">
          <DialogTitle className="text-[1.85rem] leading-none font-semibold">Share Review</DialogTitle>
          <DialogDescription className="sr-only">
            Preview the review card, download it as a JPG, or share it directly.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden bg-[#0a0a0a] px-3 py-4 sm:px-4 sm:py-4">
          <div className="flex h-full items-center justify-center rounded-[20px] border border-[#2a3250] bg-[#07080b] p-3 sm:p-4">
            {loading ? (
              <div className="flex h-[420px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            ) : review ? (
              <div className="flex h-full w-full items-center justify-center overflow-hidden">
                <div className="origin-center scale-[0.8] sm:scale-[0.45]" style={{ transformOrigin: "center center" }}>
                  <ReviewShareCard review={review} />
                </div>
              </div>
            ) : (
              <div className="flex h-[420px] items-center justify-center px-6 text-center text-sm text-rose-300">
                {error || "Unable to load preview"}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#121212] p-3 sm:p-4">
          {error ? (
            <p className="mb-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              onClick={() => void handleDownload()}
              disabled={!review || !html || busyAction !== null || loading}
              className="h-12 rounded-2xl bg-white/10 text-base font-semibold text-white hover:bg-white/16"
            >
              {busyAction === "download" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              Download
            </Button>

            <Button
              type="button"
              onClick={() => void handleShare()}
              disabled={!review || !html || busyAction !== null || loading}
              className="h-12 rounded-2xl bg-[linear-gradient(135deg,#8f4dff,#b65cff)] text-base font-semibold text-white hover:opacity-95"
            >
              {busyAction === "share" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Share2 className="h-5 w-5" />
              )}
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
