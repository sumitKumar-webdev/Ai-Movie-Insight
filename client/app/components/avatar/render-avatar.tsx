"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/resuable-component";

type RenderAvatarProps = {
  name: string;
  imageUrl?: string | null;
  className?: string;
  initialsClassName?: string;
};

export default function RenderAvatar({
  name,
  imageUrl,
  className,
  initialsClassName,
}: RenderAvatarProps) {
  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative h-10 w-10 shrink-0 overflow-hidden rounded-full md:h-12 md:w-12",
          className,
        )}
      >
        <Image unoptimized
          src={imageUrl}
          alt={`${name}'s avatar`}
          fill
          sizes="(max-width: 640px) 35px, 38px"
          className="object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 md:h-12 md:w-12",
        className,
      )}
    >
      <span
        className={cn(
          "text-sm font-semibold tracking-wide text-white/90",
          initialsClassName,
        )}
      >
        {getInitials(name)}
      </span>
    </div>
  );
}


