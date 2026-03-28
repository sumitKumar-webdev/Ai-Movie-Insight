"use client";

import { useEffect, useState } from "react";
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
import {
  buildReviewShareCardFileName,
  renderReviewShareCardToJpegBlob,
  renderReviewShareCardToObjectUrl,
} from "./share-card/review-share-renderer";

type ReviewShareModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId?: string | null;
};

export default function ReviewShareModal({
  open,
  onOpenChange,
  reviewId,
}: ReviewShareModalProps) {
  const [busyAction, setBusyAction] = useState<"download" | "share" | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<ReviewShareCardPayload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
            loadError instanceof Error
              ? loadError.message
              : "Unable to load preview",
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
    if (!open || !review) {
      setPreviewLoading(false);
      setPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
      return;
    }

    let ignore = false;
    let createdUrl: string | null = null;

    const renderPreview = async () => {
      try {
        setPreviewLoading(true);
        createdUrl = await renderReviewShareCardToObjectUrl(review);
        if (ignore) {
          if (createdUrl) {
            URL.revokeObjectURL(createdUrl);
          }
          return;
        }

        setPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          return createdUrl;
        });
      } catch (previewError) {
        if (!ignore) {
          setPreviewUrl((currentUrl) => {
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
            }
            return null;
          });
          setError(
            previewError instanceof Error
              ? previewError.message
              : "Unable to render preview",
          );
        }
      } finally {
        if (!ignore) {
          setPreviewLoading(false);
        }
      }
    };

    void renderPreview();

    return () => {
      ignore = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [open, review]);

  const fileName = buildReviewShareCardFileName(review);

  const handleDownload = async () => {
    if (!review) {
      return;
    }

    try {
      setError("");
      setBusyAction("download");
      const blob = await renderReviewShareCardToJpegBlob(review);
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
      const blob = await renderReviewShareCardToJpegBlob(review);
      const file = new File([blob], fileName, { type: "image/jpeg" });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
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
        className="w-[min(100vw-1rem,460px)] max-w-[460px] overflow-hidden rounded-3xl! border border-white/8 bg-[#121212] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.62)] sm:rounded-[30px]"
      >
        <DialogHeader className="border-b border-white/8 bg-[#141414] px-4 py-3.5 text-left sm:px-5 sm:py-4">
          <DialogTitle className="text-[1rem] leading-none font-semibold sm:text-[1.1rem]">
            Share Review
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preview the review card, download it as a JPG, or share it directly.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-[#101010] px-3 py-2 sm:px-4 sm:py-3">
          <div className="overflow-hidden rounded-lg! border border-[#2a2f3d] bg-[#0c0c0c] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:rounded-[24px] sm:p-3">
          {loading || previewLoading ? (
            <div className="flex h-[62vh] w-full flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-white/8 bg-[#151515] text-center">
              <Loader2 className="h-7 w-7 animate-spin text-white/70" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/86">Generating preview…</p>
                <p className="text-xs text-white/45">
                  Rendering your review card image
                </p>
              </div>
            </div>
          ) : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Review preview"
              className="h-auto max-h-[62vh] w-full bg-[#0b0b0b] object-contain"
            />
          ) : (
            <div className="flex h-[62vh] w-full items-center justify-center rounded-[18px] border border-rose-400/15 bg-[#171112] px-6 text-center text-sm text-rose-200">
              {error || "Unable to load preview"}
            </div>
          )}
          </div>
        </div>

        <div className="border-t border-white/8 bg-[#141414] p-3 sm:p-4">
          {error ? (
            <p className="mb-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              onClick={() => void handleDownload()}
              disabled={
                !review || busyAction !== null || loading || previewLoading
              }
              className="h-11 rounded-2xl border border-white/8 bg-[#2a2a2a] text-sm font-semibold text-white hover:bg-[#313131]"
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
              disabled={
                !review || busyAction !== null || loading || previewLoading
              }
              className="h-11 rounded-2xl bg-[linear-gradient(135deg,#f8fafc,#e8eef7)] text-sm font-semibold text-slate-950 shadow-none hover:bg-[#f4f7fb]"
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
