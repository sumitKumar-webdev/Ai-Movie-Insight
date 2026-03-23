"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ProgressListener = (value: number | null) => void;

const listeners = new Set<ProgressListener>();
let isNavigating = false;
let isPageLoading = false;

function emit(value: number | null) {
  listeners.forEach((listener) => listener(value));
}

export function startRouteProgress() {
  isNavigating = true;
  emit(16);
}

export function setRouteProgressLoading(value: boolean) {
  isPageLoading = value;

  if (value) {
    emit(16);
    return;
  }

  if (!isNavigating) {
    finishRouteProgress();
  }
}

export function finishRouteProgress() {
  emit(100);
  window.setTimeout(() => emit(null), 220);
}

export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    const listener: ProgressListener = (value) => {
      setProgress((current) => {
        if (value === null) {
          return null;
        }

        if (typeof current === "number" && value < current) {
          return current;
        }

        return value;
      });
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (progress === null || progress >= 92) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProgress((current) => {
        if (current === null || current >= 92) {
          return current;
        }

        return current + 14;
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    isNavigating = false;
    if (!isPageLoading) {
      finishRouteProgress();
    }
  }, [pathname, searchParams]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] transition-opacity duration-200 ${
        progress === null ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="h-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.85)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress ?? 0}%` }}
      />
    </div>
  );
}
