"use client";

import { cn } from "@/lib/utils";

type CompactCountProps = {
  value?: number | null;
  suffix?: string;
  className?: string;
};

export function formatCompactCount(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (value >= 1_000_000) {
    const compact = value / 1_000_000;
    return `${Number.isInteger(compact) ? compact : compact.toFixed(1)}M`;
  }

  if (value >= 1_000) {
    const compact = value / 1_000;
    return `${Number.isInteger(compact) ? compact : compact.toFixed(1)}k`;
  }

  return String(value);
}

export default function CompactCount({
  value,
  suffix,
  className,
}: CompactCountProps) {
  const formattedValue = formatCompactCount(value);

  if (!formattedValue) {
    return null;
  }

  return (
    <span className={cn(className)}>
      {formattedValue}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}
