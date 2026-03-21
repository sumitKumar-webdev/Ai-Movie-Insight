import { Film } from "lucide-react";

type PosterFallbackProps = {
  title?: string;
  className?: string;
};

export default function PosterFallback({ title, className = "" }: PosterFallbackProps) {
  return (
    <div
      className={`poster-fallback-bg relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-2 text-center ${className}`}
    >
      <Film className="relative z-10 mb-1 h-5 w-5 text-white/85 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" />
      <p className="relative z-10 line-clamp-3 text-[10px] font-medium text-white/90">
        {title || "Poster unavailable"}
      </p>
    </div>
  );
}
