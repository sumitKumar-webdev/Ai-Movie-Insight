"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type HoverMarqueeTextProps = {
  text: string;
  hoverActive: boolean;
  className?: string;
  wrapperClassName?: string;
};

export default function HoverMarqueeText({
  text,
  hoverActive,
  className,
  wrapperClassName,
}: HoverMarqueeTextProps) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const syncOverflow = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth);
    };

    syncOverflow();
    window.addEventListener("resize", syncOverflow);

    return () => {
      window.removeEventListener("resize", syncOverflow);
    };
  }, [text]);

  if (isOverflowing && hoverActive) {
    return (
      <span
        className={cn("block overflow-hidden", wrapperClassName)}
        title={text}
      >
        <span className="block movie-title-marquee">
          <span className="movie-title-marquee-track">
            <span className={cn("movie-title-marquee-item", className)}>
              {text}
            </span>
            <span className={cn("movie-title-marquee-item", className)}>
              {text}
            </span>
          </span>
        </span>
      </span>
    );
  }

  return (
    <span
      ref={textRef}
      className={cn(
        "inline-block max-w-full whitespace-nowrap align-top",
        className,
        wrapperClassName,
      )}
      title={text}
    >
      {text}
    </span>
  );
}
