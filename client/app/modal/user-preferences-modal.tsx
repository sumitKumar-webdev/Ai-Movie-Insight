"use client";

import Image from "next/image";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BrainCircuit,
  Clapperboard,
  Compass,
  Film,
  Flame,
  Ghost,
  Heart,
  MoonStar,
  Rocket,
  Search,
  Shield,
  Smile,
  Sparkles,
  Tv,
  Users,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { saveUserPreferences } from "@/app/services/auth.service";
import type { AuthUser } from "@/app/store/auth-slice";
import { setAuthenticatedUser, useAuthStore } from "@/app/store/store";

type UserPreferencesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CinemaOption = {
  key: string;
  label: string;
  image: string;
  subtitle: string;
};

type LanguageOption = {
  key: string;
  label: string;
  nativeLabel: string;
};

type KeyLabelOption = {
  key: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
};

type PreferencesState = {
  cinemas: string[];
  genres: string[];
  languages: string[];
  moods: string[];
  formats: string[];
};

const CINEMA_OPTIONS: CinemaOption[] = [
  {
    key: "Bollywood",
    label: "Bollywood",
    image: "/preferences/industries/vo6fkkelpgqwhryprzdb.avif",
    subtitle: "Hindi Cinema",
  },
  {
    key: "Hollywood",
    label: "Hollywood",
    image: "/preferences/industries/zbufdbk0xe4fwutnenru.avif",
    subtitle: "English Cinema",
  },
  {
    key: "Telugu",
    label: "Telugu",
    image: "/preferences/industries/rmawjrxiylwk463tnlwl.avif",
    subtitle: "Telugu Cinema",
  },
  {
    key: "Tamil",
    label: "Tamil",
    image: "/preferences/industries/cny18vaqqlrk5bkznooj.avif",
    subtitle: "Tamil Cinema",
  },
  {
    key: "Malayalam",
    label: "Malayalam",
    image: "/preferences/industries/prdx1yp7xjcyxfbaavig.avif",
    subtitle: "Malayalam Cinema",
  },
  {
    key: "Kannada",
    label: "Kannada",
    image: "/preferences/industries/zgrqdxj4eanjqbx2aaqj.avif",
    subtitle: "Kannada Cinema",
  },
  {
    key: "Korean",
    label: "Korean",
    image: "/preferences/industries/lnstmpeax2fle2881ojn.avif",
    subtitle: "Korean Cinema",
  },
  {
    key: "Japanese",
    label: "Japanese",
    image: "/preferences/industries/ldqrl9bzbuyyflcgo1ib.avif",
    subtitle: "Japanese Cinema",
  },
];

const GENRE_OPTIONS: KeyLabelOption[] = [
  {
    key: "Action",
    label: "Action",
    subtitle: "Impact, velocity, set pieces",
    icon: Zap,
  },
  {
    key: "Comedy",
    label: "Comedy",
    subtitle: "Witty, light, rewatchable",
    icon: Smile,
  },
  {
    key: "Drama",
    label: "Drama",
    subtitle: "Character-driven and layered",
    icon: Clapperboard,
  },
  {
    key: "Romance",
    label: "Romance",
    subtitle: "Tender, intimate, heartfelt",
    icon: Heart,
  },
  {
    key: "Thriller",
    label: "Thriller",
    subtitle: "Suspense with sharp turns",
    icon: Shield,
  },
  {
    key: "Horror",
    label: "Horror",
    subtitle: "Dread, chills, dark atmosphere",
    icon: Ghost,
  },
  {
    key: "Sci-Fi",
    label: "Sci-Fi",
    subtitle: "Futures, tech, cosmic ideas",
    icon: Rocket,
  },
  {
    key: "Crime",
    label: "Crime",
    subtitle: "Tension, secrets, underworld",
    icon: Search,
  },
  {
    key: "Adventure",
    label: "Adventure",
    subtitle: "Big journeys and discovery",
    icon: Compass,
  },
  {
    key: "Fantasy",
    label: "Fantasy",
    subtitle: "Mythic worlds and wonder",
    icon: Sparkles,
  },
  {
    key: "Mystery",
    label: "Mystery",
    subtitle: "Clues, puzzles, slow reveals",
    icon: BrainCircuit,
  },
  {
    key: "Family",
    label: "Family",
    subtitle: "Warm and all-ages friendly",
    icon: Users,
  },
];

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { key: "Hindi", label: "Hindi", nativeLabel: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { key: "English", label: "English", nativeLabel: "English" },
  { key: "Tamil", label: "Tamil", nativeLabel: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd" },
  { key: "Telugu", label: "Telugu", nativeLabel: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41" },
  { key: "Malayalam", label: "Malayalam", nativeLabel: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02" },
  { key: "Kannada", label: "Kannada", nativeLabel: "\u0c95\u0ca8\u0ccd\u0ca8\u0ca1" },
  { key: "Korean", label: "Korean", nativeLabel: "\ud55c\uad6d\uc5b4" },
  { key: "Japanese", label: "Japanese", nativeLabel: "\u65e5\u672c\u8a9e" },
];

const MOOD_OPTIONS: KeyLabelOption[] = [
  {
    key: "Feel-good",
    label: "Feel-good",
    subtitle: "Bright, easy, uplifting",
    icon: Smile,
  },
  {
    key: "Mind-bending",
    label: "Mind-bending",
    subtitle: "Twisty and idea-heavy",
    icon: BrainCircuit,
  },
  {
    key: "Emotional",
    label: "Emotional",
    subtitle: "Raw, human, moving",
    icon: Heart,
  },
  {
    key: "Dark",
    label: "Dark",
    subtitle: "Brooding and shadowy",
    icon: MoonStar,
  },
  {
    key: "Fast-paced",
    label: "Fast-paced",
    subtitle: "Quick hooks, no drag",
    icon: Zap,
  },
  {
    key: "Romantic",
    label: "Romantic",
    subtitle: "Soft chemistry and longing",
    icon: Sparkles,
  },
  {
    key: "Intense",
    label: "Intense",
    subtitle: "High stakes and pressure",
    icon: Flame,
  },
  {
    key: "Comfort watch",
    label: "Comfort watch",
    subtitle: "Cozy and familiar",
    icon: Film,
  },
];

const FORMAT_OPTIONS: KeyLabelOption[] = [
  {
    key: "New releases",
    label: "New releases",
    subtitle: "Fresh drops and current buzz",
    icon: Sparkles,
  },
  {
    key: "Classic films",
    label: "Classic films",
    subtitle: "Timeless favorites and landmarks",
    icon: Film,
  },
  {
    key: "Franchise movies",
    label: "Franchise movies",
    subtitle: "Universes, sequels, big arcs",
    icon: Clapperboard,
  },
  {
    key: "Indie films",
    label: "Indie films",
    subtitle: "Offbeat, intimate, original",
    icon: Compass,
  },
  {
    key: "Biopics",
    label: "Biopics",
    subtitle: "Lives, legacies, real stories",
    icon: Users,
  },
  {
    key: "Series",
    label: "Series",
    subtitle: "Episode-driven longer watches",
    icon: Tv,
  },
];

function toggleSelection(
  field: keyof PreferencesState,
  value: string,
  setPreferences: Dispatch<SetStateAction<PreferencesState>>,
) {
  setPreferences((current) => ({
    ...current,
    [field]: current[field].includes(value)
      ? current[field].filter((item) => item !== value)
      : [...current[field], value],
  }));
}

function buildPreferencesFromUser(
  user: AuthUser | null,
): PreferencesState {
  return {
    cinemas: Array.isArray(user?.preferences?.cinemas) ? user.preferences.cinemas : [],
    genres: Array.isArray(user?.preferences?.genres) ? user.preferences.genres : [],
    languages: Array.isArray(user?.preferences?.languages) ? user.preferences.languages : [],
    moods: Array.isArray(user?.preferences?.moods) ? user.preferences.moods : [],
    formats: Array.isArray(user?.preferences?.formats) ? user.preferences.formats : [],
  };
}

function totalSelectedCount(preferences: PreferencesState) {
  return Object.values(preferences).reduce(
    (total, selectedValues) => total + selectedValues.length,
    0,
  );
}

function PreferenceGroup({
  title,
  description,
  options,
  selected,
  onToggle,
}: {
  title: string;
  description: string;
  options: KeyLabelOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.13em] text-white/40">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-white/30">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const active = selected.includes(option.key);
          const Icon = option.icon;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onToggle(option.key)}
              className={`flex items-center gap-3 rounded-sm border px-3 py-3 text-left transition-all duration-200 ${
                active
                  ? "border-cyan-400/25 bg-cyan-400/6"
                  : "border-white/8 bg-white/0.02 hover:border-white/14 hover:bg-white/0.04"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-black/30 transition-colors ${
                  active ? "text-white" : "text-white/60"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-semibold transition-colors ${
                    active ? "text-white" : "text-white/70"
                  }`}
                >
                  {option.label}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-white/30">
                  {option.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CinemaPreferenceGroup({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.13em] text-white/40">
          Industries
        </h3>
        <p className="mt-1 text-xs leading-5 text-white/30">
          Pick the film worlds you naturally gravitate toward.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {CINEMA_OPTIONS.map((option) => {
          const active = selected.includes(option.key);

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onToggle(option.key)}
              className={`flex h-19 items-center gap-3 rounded-sm border px-2.5 py-2 text-left transition-all duration-200 ${
                active
                  ? "border-cyan-400/25 bg-cyan-400/6"
                  : "border-white/8 bg-white/0.02 hover:border-white/14 hover:bg-white/0.04"
              }`}
            >
              <div className="relative h-17 w-10 shrink-0 overflow-hidden">
                <Image
                  src={option.image}
                  alt={option.label}
                  fill
                  loading="eager"
                  sizes="50px"
                  className="object-cover opacity-90"
                />
              </div>
              <div className="min-w-0">
                <h3
                  className={`truncate text-sm font-semibold transition-colors ${
                    active ? "text-white" : "text-white/70"
                  }`}
                >
                  {option.label}
                </h3>
                <span className="block truncate text-[11px] text-white/30">
                  {option.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LanguagePreferenceGroup({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.13em] text-white/40">
          Languages
        </h3>
        <p className="mt-1 text-xs leading-5 text-white/30">
          Choose the languages you are most likely to watch in.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {LANGUAGE_OPTIONS.map((option) => {
          const active = selected.includes(option.key);

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onToggle(option.key)}
              className={`flex h-16 items-center rounded-sm border px-3 py-2 text-left transition-all duration-200 ${
                active
                  ? "border-cyan-400/25 bg-cyan-400/6"
                  : "border-white/8 bg-white/0.02 hover:border-white/14 hover:bg-white/0.04"
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`truncate text-lg font-bold tracking-tight transition-colors ${
                    active ? "text-white" : "text-white/60"
                  }`}
                >
                  {option.nativeLabel}
                </p>
                <p className="truncate text-[10px] uppercase tracking-[0.18em] text-white/30">
                  {option.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function UserPreferencesModal({
  open,
  onOpenChange,
}: UserPreferencesModalProps) {
  const user = useAuthStore((auth) => auth.user);
  const modalKey = `${user?.id ?? "guest"}-${JSON.stringify(user?.preferences ?? {})}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <UserPreferencesModalContent
          key={modalKey}
          user={user}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function UserPreferencesModalContent({
  user,
  onOpenChange,
}: {
  user: AuthUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [preferences, setPreferences] = useState<PreferencesState>(
    () => buildPreferencesFromUser(user),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalSelected = useMemo(
    () => totalSelectedCount(preferences),
    [preferences],
  );

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const result = await saveUserPreferences(preferences);

    if (!result.ok || !result.user) {
      setSaving(false);
      setError(result.message);
      return;
    }

    setAuthenticatedUser(result.user);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <DialogContent
      showCloseButton={false}
      overlayClassName="bg-black/72 backdrop-blur-none"
      className="home-search-scroll flex w-[calc(100vw-1rem)] max-h-[88vh] max-w-4xl flex-col overflow-hidden border border-white/8 bg-[#000000] p-0 text-white shadow-[0_40px_140px_rgba(0,0,0,0.9)]"
      style={{ borderRadius: 0 }}
    >
      <div className="border-b border-white/6 px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
              Your taste, your way
            </DialogTitle>
            <DialogDescription className="mt-1.5 max-w-xl text-sm leading-6 text-white/35">
              Pick industries, languages, genres, moods, and formats so CineAI knows exactly what to surface for you.
            </DialogDescription>
          </DialogHeader>

          {totalSelected > 0 && (
            <span className="rounded-sm border border-cyan-400/20 bg-cyan-400/6 px-2.5 py-1 text-xs font-medium tabular-nums text-cyan-400">
              {totalSelected} selected
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-8 sm:py-5">
        <div className="space-y-7">
          <CinemaPreferenceGroup
            selected={preferences.cinemas}
            onToggle={(value) => toggleSelection("cinemas", value, setPreferences)}
          />

          <div className="border-t border-white/5" />

          <LanguagePreferenceGroup
            selected={preferences.languages}
            onToggle={(value) => toggleSelection("languages", value, setPreferences)}
          />

          <div className="border-t border-white/5" />

          <PreferenceGroup
            title="Genres"
            description="Choose the kinds of stories you keep coming back to."
            options={GENRE_OPTIONS}
            selected={preferences.genres}
            onToggle={(value) => toggleSelection("genres", value, setPreferences)}
          />

          <div className="border-t border-white/5" />

          <PreferenceGroup
            title="Mood"
            description="The emotional tone you usually want from a watch."
            options={MOOD_OPTIONS}
            selected={preferences.moods}
            onToggle={(value) => toggleSelection("moods", value, setPreferences)}
          />

          <div className="border-t border-white/5" />

          <PreferenceGroup
            title="Formats"
            description="Extra signals about the kind of watch you enjoy."
            options={FORMAT_OPTIONS}
            selected={preferences.formats}
            onToggle={(value) => toggleSelection("formats", value, setPreferences)}
          />

          {error ? (
            <p className="border border-rose-400/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/6 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={saving}
          className="text-sm text-white/35 transition-colors hover:text-white/60 disabled:opacity-40"
        >
          Maybe later
        </button>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || totalSelected === 0}
          className="rounded-sm bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {saving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </DialogContent>
  );
}


