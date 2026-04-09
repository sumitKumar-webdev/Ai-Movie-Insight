"use client";

import Image from "next/image";
import { XIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/app/components/ui/dialog";

type PosterPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
};

export default function PosterPreviewModal({
  open,
  onOpenChange,
  imageUrl,
  title,
}: PosterPreviewModalProps) {
  const altText = title ? `${title} poster` : "Poster preview";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-transparent"
        contentWrapperClassName="p-3 sm:p-6"
        className="w-full max-w-none border-0 bg-transparent p-2 text-white shadow-none sm:max-w-5xl data-[state=open]:slide-in-from-top-8 data-[state=closed]:slide-out-to-top-4"
      >
        <DialogTitle className="sr-only">Poster preview</DialogTitle>
        <div className="relative flex w-full items-center justify-center">
          <div className="relative h-[80vh] w-[min(92vw,32rem)] sm:w-[min(85vw,36rem)] md:w-[min(80vw,40rem)] lg:w-[min(70vw,44rem)]">
            {imageUrl ? (
              <Image unoptimized
                src={imageUrl}
                alt={altText}
                fill
                sizes="(max-width: 768px) 92vw, (max-width: 1200px) 70vw, 640px"
                className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70">
                Poster unavailable
              </div>
            )}
          </div>

          <DialogClose className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/75 transition hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}


