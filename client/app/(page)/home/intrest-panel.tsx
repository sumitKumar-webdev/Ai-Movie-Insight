import type { ComponentType } from "react";
import { Badge } from "@/app/components/ui/badge";
import { UserInterestedCategory } from "@/lib/user-interested-categories";
import {
  ChevronRight,
  Clock3,
  Film,
  Globe2,
  Heart,
  Settings2,
  Sparkles,
} from "lucide-react";

type InterestProfileProps = {
  categories: UserInterestedCategory[];
  cinemas: string[];
  languages: string[];
  viewingStyle: string;
  recentlyWatched: number;
  onEditPreferences: () => void;
};

type SectionProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  emptyLabel: string;
  accentClassName?: string;
};

function chipClassName(index: number) {
  return index === 0
    ? "border-brand-primary-soft bg-brand-primary-soft text-brand-primary"
    : "border-white/10 bg-white/[0.03] text-white/70";
}

function PreferenceSection({
  icon: Icon,
  title,
  items,
  emptyLabel,
  accentClassName = "text-brand-primary",
}: SectionProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/0.03 ${accentClassName}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/38">
          {title}
        </p>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={item}
              className={`rounded-full border px-2 text-[0.72rem] font-medium shadow-none ${chipClassName(index)}`}
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-[0.82rem] leading-5 text-white/40">{emptyLabel}</p>
      )}
    </div>
  );
}

export function InterestProfile({
  categories,
  cinemas,
  languages,
  viewingStyle,
  recentlyWatched,
  onEditPreferences,
}: InterestProfileProps) {
  const topGenres = categories.slice(0, 3).map((category) => category.category);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[1.2rem] border border-white/8 bg-[#0d0e12] shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
        <div className="border-b border-white/8 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-primary-soft bg-brand-primary-soft text-brand-primary">
              <Heart className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Taste Profile
              </p>
              <h3 className="-mt-1.5 text-[1.15rem] font-semibold tracking-tight text-white">
                Your Interest
              </h3>
            </div>

            <button
              type="button"
              onClick={onEditPreferences}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.85rem] border border-white/10 bg-white/0.03 text-white/54 transition duration-300 hover:border-white/40 hover:border-2 hover:text-white"
              aria-label="Edit preferences"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[0.8rem] leading-5 text-white/44">
            A quick read on the preferences CineAI is learning from your
            activity.
          </p>

          <div className="mt-4 grid gap-3">
            {/* This Month Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]">
              {/* subtle glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 bg-gradient-to-r from-brand-primary/10 via-transparent to-transparent" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/40">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
                    This Month
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold tracking-tight text-brand-primary">
                  {recentlyWatched}
                </span>
                <span className="text-xs text-white/50 mb-[2px]">movies</span>
              </div>

              <p className="mt-1 text-[0.75rem] text-white/40">
                Your activity this month
              </p>
            </div>

            {/* Bottom Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Viewing Style */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.06]">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Viewing Style
                </p>
                <p className="mt-2 text-sm font-medium leading-5 text-white/85">
                  {viewingStyle}
                </p>
              </div>

              {/* Top Signal */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.06]">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Top Signal
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-primary">
                  {topGenres[0] ?? "Still learning"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <PreferenceSection
            icon={Film}
            title="Favorite Genres"
            items={topGenres}
            emptyLabel="No genre signals yet."
          />

          <PreferenceSection
            icon={Globe2}
            title="Languages"
            items={languages}
            emptyLabel="No language preferences yet."
            accentClassName="text-[#9bbfd3]"
          />

          <PreferenceSection
            icon={Heart}
            title="Cinema Preferences"
            items={cinemas}
            emptyLabel="No cinema preferences yet."
            accentClassName="text-[#d1b49f]"
          />
        </div>
      </div>
    </div>
  );
}
