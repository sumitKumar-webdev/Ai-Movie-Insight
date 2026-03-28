"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

async function inlineImageUrl(url?: string | null) {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) {
    return normalizedUrl || "";
  }

  try {
    const response = await fetch(normalizedUrl, { cache: "force-cache" });
    if (!response.ok) {
      return normalizedUrl;
    }

    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return normalizedUrl;
  }
}

async function inlineShareCardAssets(review: ReviewShareCardPayload | null) {
  if (!review) {
    return review;
  }

  const [posterUrl, avatarUrl] = await Promise.all([
    inlineImageUrl(review.content?.posterUrl),
    inlineImageUrl(review.user?.imageUrl),
  ]);

  return {
    ...review,
    content: {
      ...review.content,
      posterUrl,
    },
    user: {
      ...review.user,
      imageUrl: avatarUrl,
    },
  };
}

function createRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

async function loadImage(url?: string | null) {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) {
    return null;
  }

  return await new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = normalizedUrl;
  });
}

function fitTextToWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumedWords < words.length && lines.length > 0) {
    let truncated = lines[lines.length - 1] ?? "";
    while (truncated && context.measureText(`${truncated}...`).width > maxWidth) {
      truncated = truncated.slice(0, -1).trimEnd();
    }
    lines[lines.length - 1] = truncated ? `${truncated}...` : "...";
  }

  return lines;
}

function drawMultilineText(
  context: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    maxLines: number;
    lineHeight: number;
    font: string;
    color: string;
  },
) {
  context.save();
  context.font = options.font;
  context.fillStyle = options.color;
  const lines = fitTextToWidth(context, text, options.maxWidth, options.maxLines);
  lines.forEach((line, index) => {
    context.fillText(line, options.x, options.y + index * options.lineHeight);
  });
  context.restore();
}

async function renderReviewShareCardToJpegBlob(review: ReviewShareCardPayload) {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create image canvas");
  }

  const poster = await loadImage(review.content?.posterUrl);
  const avatar = await loadImage(review.user?.imageUrl);

  context.fillStyle = "#06080b";
  context.fillRect(0, 0, canvas.width, canvas.height);

  createRoundedRectPath(context, 0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT, 28);
  context.save();
  context.clip();

  const backgroundGradient = context.createLinearGradient(0, 0, 0, SHARE_CARD_HEIGHT);
  backgroundGradient.addColorStop(0, "#090b10");
  backgroundGradient.addColorStop(1, "#080a0f");
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  if (poster) {
    context.save();
    context.filter = "brightness(0.82) saturate(1.06) contrast(1.02)";
    context.drawImage(poster, 0, 0, SHARE_CARD_WIDTH, 640);
    context.restore();
  }

  const posterGradient = context.createLinearGradient(0, 0, 0, 640);
  posterGradient.addColorStop(0, "rgba(6,8,11,0.04)");
  posterGradient.addColorStop(0.34, "rgba(6,8,11,0.12)");
  posterGradient.addColorStop(0.78, "rgba(6,8,11,0.72)");
  posterGradient.addColorStop(1, "#090c0f");
  context.fillStyle = posterGradient;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, 640);

  const horizontalGradient = context.createLinearGradient(0, 0, SHARE_CARD_WIDTH, 0);
  horizontalGradient.addColorStop(0, "rgba(6,8,11,0.2)");
  horizontalGradient.addColorStop(0.18, "transparent");
  horizontalGradient.addColorStop(0.82, "transparent");
  horizontalGradient.addColorStop(1, "rgba(6,8,11,0.26)");
  context.fillStyle = horizontalGradient;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, 640);

  context.fillStyle = "rgba(9,12,15,0.72)";
  createRoundedRectPath(context, 16, 16, 124, 28, 20);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.1)";
  context.lineWidth = 1;
  context.stroke();

  context.fillStyle = "#5ce0ff";
  context.beginPath();
  context.arc(29, 30, 3, 0, Math.PI * 2);
  context.fill();

  context.font = "500 10px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.45)";
  context.fillText("CineAI Review", 38, 33);

  context.font = "500 11px sans-serif";
  context.fillStyle = "rgba(92,224,255,0.56)";
  context.fillText(
    `${review.content?.type?.trim() || "Movie"} · ${review.content?.year?.trim() || "Unknown"}`,
    24,
    560,
  );

  drawMultilineText(context, review.content?.title?.trim() || "Untitled", {
    x: 24,
    y: 602,
    maxWidth: 360,
    maxLines: 3,
    lineHeight: 42,
    font: "600 40px serif",
    color: "#ffffff",
  });

  if (avatar) {
    context.save();
    createRoundedRectPath(context, 24, 658, 34, 34, 17);
    context.clip();
    context.drawImage(avatar, 24, 658, 34, 34);
    context.restore();
  } else {
    const avatarGradient = context.createLinearGradient(24, 658, 58, 692);
    avatarGradient.addColorStop(0, "#10263d");
    avatarGradient.addColorStop(1, "#0b1724");
    context.fillStyle = avatarGradient;
    createRoundedRectPath(context, 24, 658, 34, 34, 17);
    context.fill();
  }

  context.strokeStyle = "rgba(92,224,255,0.16)";
  context.lineWidth = 1;
  createRoundedRectPath(context, 24, 658, 34, 34, 17);
  context.stroke();

  if (!avatar) {
    const initials = (review.user?.name || review.user?.username || "CR")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    context.font = "600 12px sans-serif";
    context.fillStyle = "rgba(92,224,255,0.82)";
    context.fillText(initials || "CR", 30, 679);
  }

  context.font = "600 13px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.fillText(review.user?.name?.trim() || "Anonymous", 68, 671);

  context.font = "400 11px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.38)";
  const reviewDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";
  context.fillText(
    `@${review.user?.username?.trim() || "cineai_user"} · ${reviewDate}`,
    68,
    687,
  );

  context.fillStyle = "rgba(255,255,255,0.065)";
  context.fillRect(24, 708, SHARE_CARD_WIDTH - 48, 1);

  drawMultilineText(context, review.text?.trim() || "", {
    x: 24,
    y: 740,
    maxWidth: SHARE_CARD_WIDTH - 48,
    maxLines: 8,
    lineHeight: 31,
    font: "400 17px sans-serif",
    color: "rgba(255,255,255,0.78)",
  });

  context.fillStyle = "rgba(255,255,255,0.06)";
  context.fillRect(24, 922, SHARE_CARD_WIDTH - 48, 1);

  context.font = "600 12px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.18)";
  context.textAlign = "center";
  context.fillText("CineAI", SHARE_CARD_WIDTH / 2, 946);
  context.restore();

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
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

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

  useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) {
      return;
    }

    const updateScale = () => {
      const availableWidth = Math.max(viewport.clientWidth - 16, 0);
      const availableHeight = Math.max(viewport.clientHeight - 16, 0);

      if (!availableWidth || !availableHeight) {
        setPreviewScale(1);
        return;
      }

      const widthScale = availableWidth / SHARE_CARD_WIDTH;
      const heightScale = availableHeight / SHARE_CARD_HEIGHT;
      const nextScale = Math.min(widthScale, heightScale, 1);
      setPreviewScale(Number.isFinite(nextScale) ? nextScale : 1);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [open, review]);

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
      setError("");
      setBusyAction("download");
      const exportReview = await inlineShareCardAssets(review);
      if (!exportReview) {
        throw new Error("Unable to prepare share card");
      }
      const blob = await renderReviewShareCardToJpegBlob(exportReview);
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
      setError("");
      setBusyAction("share");
      const exportReview = await inlineShareCardAssets(review);
      if (!exportReview) {
        throw new Error("Unable to prepare share card");
      }
      const blob = await renderReviewShareCardToJpegBlob(exportReview);
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
        contentWrapperClassName="overflow-hidden p-2 sm:p-4"
        className="w-[min(100vw-1rem,460px)] max-w-[460px] overflow-hidden rounded-[24px] border border-white/10 bg-[#121212] p-0 text-white sm:rounded-[28px]"
      >
        <DialogHeader className="border-b border-white/10 px-4 py-3 text-left sm:px-5 sm:py-3.5">
          <DialogTitle className="text-[1.2rem] leading-none font-semibold sm:text-[1.75rem]">Share Review</DialogTitle>
          <DialogDescription className="sr-only">
            Preview the review card, download it as a JPG, or share it directly.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
          <div
            ref={previewViewportRef}
            className="flex h-[min(58dvh,520px)] min-h-[250px] items-center justify-center overflow-hidden rounded-[18px] border border-[#2a3250] bg-[#07080b] p-2 sm:h-[min(56vh,500px)] sm:min-h-[360px] sm:rounded-[22px] sm:p-3"
          >
            {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            ) : review ? (
              <div
                className="flex items-center justify-center"
                style={{
                  width: SHARE_CARD_WIDTH * previewScale,
                  height: SHARE_CARD_HEIGHT * previewScale,
                }}
              >
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: "center center",
                  }}
                >
                  <ReviewShareCard review={review} />
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-rose-300">
                {error || "Unable to load preview"}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#121212] p-3 sm:p-3.5">
          {error ? (
            <p className="mb-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              onClick={() => void handleDownload()}
              disabled={!review || busyAction !== null || loading}
              className="h-11 rounded-2xl bg-white/10 text-sm font-semibold text-white hover:bg-white/16"
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
              disabled={!review || busyAction !== null || loading}
              className="h-11 rounded-2xl bg-[linear-gradient(135deg,#8f4dff,#b65cff)] text-sm font-semibold text-white hover:opacity-95"
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
