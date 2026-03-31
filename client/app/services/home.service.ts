import { ListTitlesParams, ListTitlesState } from "../models/service.modal";

export const EMPTY_LIST_TITLES_STATE: ListTitlesState = {
  types: [],
  genres: [],
  countryCodes: [],
  languageCodes: [],
  nameIds: [],
  interestIds: [],
  startYear: "",
  endYear: "",
  minVoteCount: "",
  maxVoteCount: "",
  minAggregateRating: "",
  maxAggregateRating: "",
  sortBy: "",
  sortOrder: "",
  pageToken: "",
};

function toNumber(value: string): number | undefined {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildListTitlesParamsFromState(
  state: ListTitlesState,
): ListTitlesParams {
  return {
    types: state.types.length ? state.types : undefined,
    genres: state.genres.length ? state.genres : undefined,
    countryCodes: state.countryCodes.length ? state.countryCodes : undefined,
    languageCodes: state.languageCodes.length ? state.languageCodes : undefined,
    nameIds: state.nameIds.length ? state.nameIds : undefined,
    interestIds: state.interestIds.length ? state.interestIds : undefined,
    startYear: toNumber(state.startYear),
    endYear: toNumber(state.endYear),
    minVoteCount: toNumber(state.minVoteCount),
    maxVoteCount: toNumber(state.maxVoteCount),
    minAggregateRating: toNumber(state.minAggregateRating),
    maxAggregateRating: toNumber(state.maxAggregateRating),
    sortBy: state.sortBy || undefined,
    sortOrder: state.sortOrder || undefined,
    pageToken: state.pageToken.trim() || undefined,
  };
}

const INDUSTRY_TO_COUNTRY: Record<string, string[]> = {
  bollywood: ["IN"],
  hollywood: ["US", "GB"],
  telugu: ["IN"],
  tamil: ["IN"],
  malayalam: ["IN"],
  kannada: ["IN"],
  korean: ["KR"],
  japanese: ["JP"],
};

const INDUSTRY_TO_LANGUAGE: Record<string, string[]> = {
  bollywood: ["hin"],
  hollywood: ["eng"],
  telugu: ["tel"],
  tamil: ["tam"],
  malayalam: ["mal"],
  kannada: ["kan"],
  korean: ["kor"],
  japanese: ["jpn"],
};

const LANGUAGE_TO_CODE: Record<string, string> = {
  hindi: "hin",
  english: "eng",
  tamil: "tam",
  telugu: "tel",
  malayalam: "mal",
  kannada: "kan",
  korean: "kor",
  japanese: "jpn",
};

const MOOD_TO_RATING: Record<string, number> = {
  "mind-bending": 7.5,
  intense: 7,
  dark: 7,
  emotional: 7,
  "feel-good": 6.5,
  romantic: 6.5,
  "fast-paced": 6.5,
  "comfort watch": 6,
};

function normalizePreferenceList(value: string[] | undefined, limit: number) {
  const seen = new Set<string>();

  return (Array.isArray(value) ? value : [])
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) {
        return false;
      }

      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function buildHomeTitleFilters(options: {
  mode: "release" | "interest";
  fallbackGenres: string[];
  preferences?: {
    cinemas?: string[];
    genres?: string[];
    languages?: string[];
    moods?: string[];
    formats?: string[];
  };
}): ListTitlesParams {
  const currentYear = new Date().getUTCFullYear();
  const preferences = options.preferences ?? {};
  const cinemas = normalizePreferenceList(preferences.cinemas, 6).map((item) =>
    item.toLowerCase(),
  );
  const genres = normalizePreferenceList(preferences.genres, 6);
  const languages = normalizePreferenceList(preferences.languages, 6).map((item) =>
    item.toLowerCase(),
  );
  const moods = normalizePreferenceList(preferences.moods, 4).map((item) =>
    item.toLowerCase(),
  );

  const countryCodes = Array.from(
    new Set(cinemas.flatMap((item) => INDUSTRY_TO_COUNTRY[item] ?? [])),
  ).slice(0, 3);

  const languageCodes = Array.from(
    new Set([
      ...languages.map((item) => LANGUAGE_TO_CODE[item]).filter(Boolean),
      ...cinemas.flatMap((item) => INDUSTRY_TO_LANGUAGE[item] ?? []),
    ]),
  ).slice(0, 3);

  const moodRatings = moods
    .map((item) => MOOD_TO_RATING[item])
    .filter((value): value is number => typeof value === "number");

  const selectedGenres = (genres.length ? genres : options.fallbackGenres).slice(0, 4);
  if (options.mode === "release") {
    return {
      types: ["MOVIE"],
      countryCodes: countryCodes.length ? countryCodes.slice(0, 1) : undefined,
      languageCodes: languageCodes.length ? languageCodes.slice(0, 2) : undefined,
      startYear: currentYear - 1,
      endYear: currentYear + 1,
      minVoteCount: 10,
      sortBy: "SORT_BY_RELEASE_DATE",
      sortOrder: "DESC",
    };
  }

  return {
    types: ["MOVIE"],
    genres: selectedGenres.length ? selectedGenres.slice(0, 2) : undefined,
    startYear: currentYear - 4,
    endYear: currentYear + 1,
    minVoteCount: 50,
    minAggregateRating: moodRatings.length ? Math.min(...moodRatings) : undefined,
    sortBy: "SORT_BY_POPULARITY",
    sortOrder: "DESC",
  };
}
