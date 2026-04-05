import {
  fetchImdbTitleGenresById,
  fetchImdbTitleById,
  fetchImdbTitleCredits,
  fetchImdbTitleReleaseDates,
  fetchImdbTitleVideos,
  listImdbTitles,
  searchMoviesByQuery,
} from "../lib/movie.js";
import { chatWithMovieAssistant, getPersonalSuggestionAI } from "../lib/openai.js";
import { getStoredMovieAiInsight } from "./movie-insight.controller.js";
import User from "../models/User.js";
import { INDUSTRY_TO_COUNTRY, INDUSTRY_TO_LANGUAGE, LANGUAGE_TO_CODE, MOOD_TO_RATING, MOOD_TO_SORT, FORMAT_TO_PARAMS, resolveInterestIdsFromPreferences } from "../lib/mapper.js";

const IMDB_ID_REGEX = /^tt\d{7,8}$/i;
const PERSONAL_SELECTION_MIN = 5;
const PERSONAL_SELECTION_LIMIT = 8;
const PERSONAL_SELECTION_TTL_DAYS = 7;

function normalizeSuggestionQuery(value) {
  return String(value ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b\d{4}\b/g, " ")
    .replace(/[":]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePreferenceList(value, limit = 8) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map((item) => String(item ?? "").trim())
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function normalizeSearchHistoryList(value, limit = 20) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map((item) => ({
      imdbId: String(item?.imdbId ?? "").trim().toLowerCase(),
      title: String(item?.title ?? "").trim(),
    }))
    .filter(({ imdbId, title }) => {
      if (!imdbId || !title || seen.has(imdbId)) return false;
      seen.add(imdbId);
      return true;
    })
    .slice(0, limit);
}

function normalizeSavedPersonalSelectionItems(value, limit = PERSONAL_SELECTION_LIMIT) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map((item) => ({
      imdbId: String(item?.imdbId ?? "").trim().toLowerCase(),
      title: String(item?.title ?? "").trim(),
      year: String(item?.year ?? "N/A").trim() || "N/A",
      poster: typeof item?.poster === "string" ? item.poster.trim() : "",
      type: typeof item?.type === "string" ? item.type.trim() : "movie",
    }))
    .filter(({ imdbId, title }) => {
      if (!imdbId || !title || seen.has(imdbId)) return false;
      seen.add(imdbId);
      return true;
    })
    .slice(0, limit);
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item ?? "").split(",")).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function toOptionalNumber(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRuntime(runtimeSeconds) {
  if (!runtimeSeconds || runtimeSeconds <= 0) return "N/A";
  const total = Math.round(runtimeSeconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function joinNames(items) {
  const value = (items ?? []).map((item) => item?.name?.trim()).filter(Boolean).join(", ");
  return value || "Unknown";
}

function uniquePeople(people, fallbackRoles = []) {
  const seen = new Set();
  return (people ?? []).reduce((acc, person) => {
    const id = person?.id?.trim();
    const name = person?.displayName?.trim();
    if (!id || !name || seen.has(id)) return acc;
    seen.add(id);
    acc.push({ id, name, imageUrl: person?.primaryImage?.url?.trim() || null, roles: fallbackRoles.filter(Boolean), characters: [] });
    return acc;
  }, []);
}

function extractMentionedTitles(reply) {
  const text = String(reply ?? "").trim();
  if (!text) return [];

  const matches = [];
  for (const pattern of [/"([^"\n]{2,80})"/g, /\*([^*\n]{2,80})\*/g]) {
    for (const match of text.matchAll(pattern)) {
      const title = normalizeSuggestionQuery(match[1]);
      if (title) matches.push(title);
    }
  }

  return Array.from(new Set(matches)).slice(0, 3);
}

function buildSearchFallbackQueries(query) {
  const q = normalizeSuggestionQuery(query);
  if (!q) return [];

  const compact = q.split(/\s+/).slice(0, 5).join(" ");
  return Array.from(new Set([
    q,
    q.split("-")[0]?.trim(),
    q.split(":")[0]?.trim(),
    q.split(",")[0]?.trim(),
    compact,
  ].filter(Boolean)));
}

function isGeminiQuotaError(message) {
  const s = String(message ?? "").toLowerCase();
  return s.includes("quota exceeded") || s.includes("rate-limit") || s.includes("rate limits") || s.includes("generate_content_free_tier_requests");
}

function buildQuotaFallbackReply(userMessage) {
  const msg = String(userMessage ?? "").replace(/\s+/g, " ").trim();
  return msg
    ? `admin ka ghee khatam h 30s baad try karna jab tak ye try kar lo: "${msg}" based kuch picks dekh lo.`
    : "admin ka ghee khatam h 30s baad try karna jab tak ye try kar lo.";
}

function hasEnoughPersonalSelectionItems(items) {
  return normalizeSavedPersonalSelectionItems(items).length >= PERSONAL_SELECTION_MIN;
}

function isPersonalSelectionFresh(personalSelection) {
  const items = normalizeSavedPersonalSelectionItems(personalSelection?.items);
  const refreshAfter = personalSelection?.refreshAfter ? new Date(personalSelection.refreshAfter) : null;
  return items.length >= PERSONAL_SELECTION_MIN && !!refreshAfter && Number.isFinite(refreshAfter.getTime()) && refreshAfter.getTime() > Date.now();
}

function buildPersonalSelectionPayload(personalSelection) {
  const toIso = (val) => {
    const d = val ? new Date(val) : null;
    return d && Number.isFinite(d.getTime()) ? d.toISOString() : null;
  };

  return {
    items: normalizeSavedPersonalSelectionItems(personalSelection?.items),
    updatedAt: toIso(personalSelection?.updatedAt),
    refreshAfter: toIso(personalSelection?.refreshAfter),
  };
}

// ─── Credits / crew ──────────────────────────────────────────────────────────

function normalizeCredits(credits, kind) {
  const people = new Map();

  for (const credit of credits ?? []) {
    const category = typeof credit?.category === "string" ? credit.category.trim() : "";
    const person = credit?.name;
    const id = person?.id?.trim();
    const name = person?.displayName?.trim();
    if (!id || !name || !category) continue;

    const isCast = Array.isArray(credit?.characters) && credit.characters.length > 0;
    if (kind === "cast" && !isCast) continue;
    if (kind === "crew" && isCast) continue;

    const entry = people.get(id) ?? { id, name, imageUrl: person?.primaryImage?.url?.trim() || null, roles: [], characters: [] };

    if (!entry.roles.includes(category)) entry.roles.push(category);

    for (const char of Array.isArray(credit?.characters) ? credit.characters : []) {
      const v = typeof char === "string" ? char.trim() : "";
      if (v && !entry.characters.includes(v)) entry.characters.push(v);
    }

    people.set(id, entry);
  }

  return Array.from(people.values());
}

function mergeCrew(directors, writers) {
  const merged = new Map();
  for (const person of [...uniquePeople(directors, ["director"]), ...uniquePeople(writers, ["writer"])]) {
    const entry = merged.get(person.id) ?? { ...person, roles: [] };
    for (const role of person.roles) {
      if (role && !entry.roles.includes(role)) entry.roles.push(role);
    }
    merged.set(person.id, entry);
  }
  return Array.from(merged.values());
}

// ─── Movie formatting ─────────────────────────────────────────────────────────

function getBackdropFromVideos(payload) {
  for (const type of ["trailer", "teaser", "clip"]) {
    const match = (payload?.videos ?? []).find(
      (v) => v?.type === type && typeof v?.primaryImage?.url === "string" && v.primaryImage.url.trim(),
    );
    if (match) return match.primaryImage.url.trim();
  }
  return "";
}

function getIndiaReleaseDetails(payload) {
  const indiaRelease = (payload?.releaseDates ?? []).find(
    (item) => (item?.country?.code === "IN" || item?.country?.name === "India") && typeof item?.releaseDate?.year === "number",
  );

  if (!indiaRelease?.releaseDate?.year) return { releaseDate: "N/A", isReleased: false };

  const { year, month, day } = indiaRelease.releaseDate;
  const monthName = typeof month === "number"
    ? new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-GB", { month: "long" })
    : null;
  const releaseDate = [day, monthName, year].filter(Boolean).join(" ") || "N/A";

  let isReleased = true;
  if (typeof year === "number") {
    isReleased = (typeof month === "number" && typeof day === "number")
      ? Date.UTC(year, month - 1, day, 23, 59, 59, 999) <= Date.now()
      : year <= new Date().getUTCFullYear();
  }

  return { releaseDate, isReleased };
}

function formatMovieInsight(title, fallbackImdbId, options = {}) {
  const credits = Array.isArray(options.credits) ? options.credits : [];
  const cast = credits.length > 0 ? normalizeCredits(credits, "cast") : uniquePeople(title.stars);
  const crew = credits.length > 0 ? normalizeCredits(credits, "crew") : mergeCrew(title.directors, title.writers);

  return {
    imdbId: title.id ?? fallbackImdbId,
    title: title.primaryTitle ?? `Movie ${fallbackImdbId}`,
    year: (typeof options.year === "string" ? options.year.trim() : "") || String(title.startYear ?? "Unknown"),
    type: title.type,
    releaseDate: options.releaseDate?.trim() || "N/A",
    isReleased: options.isReleased ?? false,
    runtime: formatRuntime(title.runtimeSeconds),
    rating: title.rating?.aggregateRating?.toFixed(1) ?? "N/A",
    ratingCount: typeof title.rating?.voteCount === "number" ? title.rating.voteCount : undefined,
    language: joinNames(title.spokenLanguages),
    country: joinNames(title.originCountries),
    ageRating: (typeof title.contentRating === "string" ? title.contentRating.trim() : "") || "N/A",
    poster: title.primaryImage?.url ?? "",
    backdrop: (typeof options.backdrop === "string" ? options.backdrop.trim() : "") || title.primaryImage?.url || "",
    overview: title.plot?.trim() || "Overview unavailable.",
    genres: Array.isArray(title.genres) ? title.genres : [],
    cast,
    crew,
  };
}

// ─── Preference resolution ────────────────────────────────────────────────────

function resolveListParamsFromPreferences(preferences) {
  const rawIndustries = Array.isArray(preferences?.industries)
    ? preferences.industries
    : preferences?.cinemas;
  const industries = normalizePreferenceList(rawIndustries, 6).map((i) => i.toLowerCase());
  const languages = normalizePreferenceList(preferences?.languages, 6).map((l) => l.toLowerCase());
  const genres = normalizePreferenceList(preferences?.genres, 6);
  const moods = normalizePreferenceList(preferences?.moods, 4).map((m) => m.toLowerCase());
  const formats = normalizePreferenceList(preferences?.formats, 4).map((f) => f.toLowerCase());
  const currentYear = new Date().getUTCFullYear();
  const interestIds = resolveInterestIdsFromPreferences({
    ...preferences,
    industries: rawIndustries,
  }).slice(0, 8);

  // Country codes from industries
  const countryCodes = Array.from(new Set(
    industries.flatMap((i) => INDUSTRY_TO_COUNTRY[i] ?? [])
  )).slice(0, 5);

  // Language codes: from explicit language prefs + industry-implied languages
  const langCodesFromPrefs = languages.map((l) => LANGUAGE_TO_CODE[l]).filter(Boolean);
  const langCodesFromIndustry = industries.flatMap((i) => INDUSTRY_TO_LANGUAGE[i] ?? []);
  const languageCodes = Array.from(new Set([...langCodesFromPrefs, ...langCodesFromIndustry])).slice(0, 5);

  // Mood → rating floor + sort signal
  const moodRatings = moods.map((m) => MOOD_TO_RATING[m]).filter(Boolean);
  const minAggregateRating = moodRatings.length ? Math.min(...moodRatings) : 6.0;
  const moodSort = moods.map((m) => MOOD_TO_SORT[m]).find(Boolean);

  // Format → year range + vote count signals
  let startYear = currentYear - 3;
  let endYear = currentYear + 1;
  let minVoteCount = 250;
  let maxVoteCount = undefined;

  for (const format of formats) {
    const p = FORMAT_TO_PARAMS[format];
    if (!p) continue;
    if (p.yearOffset !== undefined) startYear = Math.min(startYear, currentYear + p.yearOffset);
    if (p.endYearOffset !== undefined) endYear = Math.min(endYear, currentYear + p.endYearOffset);
    if (p.minVoteCount !== undefined) minVoteCount = Math.max(minVoteCount, p.minVoteCount);
    if (p.maxVoteCount !== undefined) maxVoteCount = p.maxVoteCount;
  }

  return {
    genres: genres.slice(0, 4),
    interestIds,
    countryCodes,
    languageCodes,
    minAggregateRating,
    sortBy: moodSort ?? "SORT_BY_POPULARITY",
    sortOrder: "DESC",
    startYear,
    endYear,
    minVoteCount,
    ...(maxVoteCount !== undefined && { maxVoteCount }),
  };
}

// ─── Personal selection ───────────────────────────────────────────────────────

async function collectSuggestionResults(queries, limit = 3) {
  const results = [];
  const seen = new Set();

  for (const rawQuery of queries) {
    const q = normalizeSuggestionQuery(rawQuery);
    if (!q) continue;

    const candidates = Array.from(new Set([q, q.split("-")[0]?.trim(), q.split(",")[0]?.trim()].filter(Boolean)));

    for (const candidate of candidates) {
      const found = await searchMoviesByQuery(candidate, { limit: 1 });
      const best = found.find((r) => r?.imdbId && !seen.has(r.imdbId));
      if (best) {
        seen.add(best.imdbId);
        results.push(best);
        break;
      }
    }

    if (results.length >= Math.max(1, limit)) return results;
  }

  return results;
}

async function resolveSearchHistoryGenres(searchHistory) {
  const counts = new Map();

  const payloads = await Promise.all(
    searchHistory.map((item) => fetchImdbTitleGenresById(item.imdbId).catch(() => null)),
  );

  for (const movie of payloads) {
    if (!movie) continue;
    const localSeen = new Set();
    for (const genre of movie.genres) {
      const g = String(genre ?? "").trim();
      if (!g || localSeen.has(g.toLowerCase())) continue;
      localSeen.add(g.toLowerCase());
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort(([a, av], [b, bv]) => bv - av || a.localeCompare(b))
    .map(([genre]) => genre);
}

function buildSearchQueriesFromPreferenceSignals(searchHistory, preferences, genres) {
  const titles = searchHistory.map((i) => String(i?.title ?? "").trim()).filter(Boolean).slice(0, 5);
  const prefGenres = normalizePreferenceList(preferences?.genres, 4);
  const prefLangs = normalizePreferenceList(preferences?.languages, 2);
  const prefMoods = normalizePreferenceList(preferences?.moods, 2);
  const prefIndustries = normalizePreferenceList(preferences?.industries, 3);
  const prefFormats = normalizePreferenceList(preferences?.formats, 2);

  return Array.from(new Set([
    ...titles,
    ...genres.map((g) => `${g} movie`),
    ...prefGenres.map((g) => `${g} latest movie`),
    ...prefLangs.map((l) => `${l} movie`),
    ...prefMoods.map((m) => `${m} movie`),
    ...prefIndustries.map((i) => `${i} movie`),
    ...prefFormats.map((f) => `${f} movie`),
    ...prefGenres.flatMap((g) => prefIndustries.map((i) => `${g} ${i} movie`)),
    ...prefGenres.flatMap((g) => prefLangs.map((l) => `${g} ${l} movie`)),
  ].map(normalizeSuggestionQuery).filter(Boolean))).slice(0, 14);
}

function buildPersonalSelectionFallback(candidates, excludedMovieIds) {
  const selections = [];
  const seenGenres = new Set();

  for (const candidate of candidates) {
    if (selections.length >= PERSONAL_SELECTION_LIMIT) break;

    const imdbId = String(candidate?.imdbId ?? "").trim().toLowerCase();
    if (!imdbId || excludedMovieIds.has(imdbId)) continue;

    const genres = Array.isArray(candidate?.genres) ? candidate.genres : [];
    const hasFreshGenre = genres.some((g) => {
      const key = String(g ?? "").trim().toLowerCase();
      return key && !seenGenres.has(key);
    });

    if (selections.length >= 4 && !hasFreshGenre) continue;

    excludedMovieIds.add(imdbId);
    genres.forEach((g) => { const key = String(g ?? "").trim().toLowerCase(); if (key) seenGenres.add(key); });

    selections.push({
      imdbId,
      title: String(candidate?.title ?? "").trim(),
      year: String(candidate?.year ?? "N/A").trim() || "N/A",
      poster: typeof candidate?.poster === "string" ? candidate.poster.trim() : "",
      type: typeof candidate?.type === "string" ? candidate.type.trim() : "movie",
    });
  }

  return normalizeSavedPersonalSelectionItems(selections, PERSONAL_SELECTION_LIMIT);
}

async function generateWeeklyPersonalSelection(user, searchHistory) {
  const normalizedHistory = normalizeSearchHistoryList(searchHistory);
  const historyGenres = await resolveSearchHistoryGenres(normalizedHistory);
  const preferenceGenres = normalizePreferenceList(user?.preferences?.genres, 6);
  const combinedGenres = Array.from(new Set(
    [...historyGenres, ...preferenceGenres].map((g) => g.trim()).filter(Boolean)
  )).slice(0, 4);

  const excludedMovieIds = new Set(normalizedHistory.map((i) => i.imdbId));
  const currentYear = new Date().getUTCFullYear();

  // Build rich params from ALL preferences
  const listParams = resolveListParamsFromPreferences(user?.preferences ?? {});

  // Fall back to history genres if no genre preference set
  if (!listParams.genres.length) {
    listParams.genres = combinedGenres;
  }

  const { items } = await listImdbTitles({
    ...listParams,
    startYear: listParams.startYear ?? currentYear - 2,
  }).catch(() => ({ items: [] }));

  const candidates = items.slice(0, 30)
    .map((movie) => {
      const imdbId = String(movie?.imdbId ?? "").trim().toLowerCase();
      if (!imdbId || excludedMovieIds.has(imdbId)) return null;
      return {
        imdbId,
        title: String(movie?.title ?? "").trim(),
        year: String(movie?.year ?? "N/A").trim() || "N/A",
        poster: typeof movie?.poster === "string" ? movie.poster.trim() : "",
        type: typeof movie?.type === "string" ? movie.type.trim() : "movie",
        genres: Array.isArray(movie?.genres) ? movie.genres : [],
      };
    })
    .filter(Boolean);

  // Try AI suggestions with full preferences
  try {
    const suggestedTitles = await getPersonalSuggestionAI({
      searchHistory: normalizedHistory,
      preferences: {
        industries: normalizePreferenceList(user?.preferences?.industries, 6),
        genres: normalizePreferenceList(user?.preferences?.genres, 6),
        languages: normalizePreferenceList(user?.preferences?.languages, 6),
        moods: normalizePreferenceList(user?.preferences?.moods, 6),
        cinemas: normalizePreferenceList(user?.preferences?.cinemas, 6),
        formats: normalizePreferenceList(user?.preferences?.formats, 6),
      },
      limit: PERSONAL_SELECTION_LIMIT,
    });

    const selections = normalizeSavedPersonalSelectionItems(
      await collectSuggestionResults(suggestedTitles, PERSONAL_SELECTION_LIMIT),
      PERSONAL_SELECTION_LIMIT,
    );

    if (hasEnoughPersonalSelectionItems(selections)) return selections;
  } catch (error) {
    console.error("[movie:personalSelection:ai]", error instanceof Error ? error.message : error);
  }

  // Fallback: preference signal search queries
  const fallbackQueries = buildSearchQueriesFromPreferenceSignals(
    normalizedHistory,
    user?.preferences ?? {},
    combinedGenres,
  );
  const fallbackSelections = normalizeSavedPersonalSelectionItems(
    await collectSuggestionResults(fallbackQueries, PERSONAL_SELECTION_LIMIT),
    PERSONAL_SELECTION_LIMIT,
  );

  if (hasEnoughPersonalSelectionItems(fallbackSelections)) return fallbackSelections;

  // Last resort: local candidates from listImdbTitles
  return buildPersonalSelectionFallback(candidates, excludedMovieIds).slice(0, PERSONAL_SELECTION_LIMIT);
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function searchMovies(req, res) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) return res.status(200).json({ data: [] });

    let data = [];
    for (const candidate of buildSearchFallbackQueries(query)) {
      data = await searchMoviesByQuery(candidate, { limit: 25 });
      if (data.length > 0) break;
    }

    return res.status(200).json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search movies";
    console.error("[movie:search]", message);
    return res.status(500).json({ error: message });
  }
}

export async function listTitles(req, res) {
  try {
    const data = await listImdbTitles({
      genres: toStringArray(req.query.genres),
      countryCodes: toStringArray(req.query.countryCodes),
      languageCodes: toStringArray(req.query.languageCodes),
      nameIds: toStringArray(req.query.nameIds),
      interestIds: toStringArray(req.query.interestIds),
      startYear: toOptionalNumber(req.query.startYear),
      endYear: toOptionalNumber(req.query.endYear),
      minVoteCount: toOptionalNumber(req.query.minVoteCount),
      maxVoteCount: toOptionalNumber(req.query.maxVoteCount),
      minAggregateRating: toOptionalNumber(req.query.minAggregateRating),
      maxAggregateRating: toOptionalNumber(req.query.maxAggregateRating),
      sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy.trim() : undefined,
      sortOrder: typeof req.query.sortOrder === "string" ? req.query.sortOrder.trim() : undefined,
      pageSize: toOptionalNumber(req.query.pageSize),
      pageToken: typeof req.query.pageToken === "string" ? req.query.pageToken.trim() : undefined,
    });

    return res.status(200).json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list titles";
    console.error("[movie:listTitles]", message);
    return res.status(500).json({ error: message });
  }
}

export async function chatMovieAssistant(req, res) {
  try {
    const sanitizedMessages = (req.body?.messages ?? [])
      .map((m) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: typeof m?.content === "string" ? m.content.trim() : "" }))
      .filter((m) => m.content);

    if (sanitizedMessages.length === 0) {
      return res.status(400).json({ error: "At least one message is required" });
    }

    const latestUserMessage = [...sanitizedMessages].reverse().find((m) => m.role === "user")?.content || "";

    let aiResult = null;
    let aiErrorMessage = "";
    let isQuotaLimited = false;

    try {
      aiResult = await chatWithMovieAssistant(sanitizedMessages);
    } catch (error) {
      aiErrorMessage = error instanceof Error ? error.message : "Failed to chat with movie assistant";
      isQuotaLimited = (error instanceof Error && error.code === "GEMINI_QUOTA_EXCEEDED") || isGeminiQuotaError(aiErrorMessage);
      if (isQuotaLimited) aiErrorMessage = buildQuotaFallbackReply(latestUserMessage);
    }

    const suggestionQueries = aiResult?.suggestions?.length
      ? aiResult.suggestions
      : extractMentionedTitles(aiResult?.reply).length
        ? extractMentionedTitles(aiResult?.reply)
        : (isQuotaLimited && latestUserMessage ? buildSearchFallbackQueries(latestUserMessage) : []);

    const suggestions = await collectSuggestionResults(suggestionQueries);

    const reply = aiResult?.reply
      || (isQuotaLimited ? aiErrorMessage : suggestions.length > 0 ? "Here are a few picks you might enjoy." : aiErrorMessage || "Failed, please try again.");

    return res.status(200).json({ data: { reply, suggestions } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to chat with movie assistant";
    return res.status(500).json({ error: message });
  }
}

export async function getMovieByImdbId(req, res) {
  try {
    const imdbId = typeof req.params?.imdbId === "string" ? req.params.imdbId.trim().toLowerCase() : "";
    if (!IMDB_ID_REGEX.test(imdbId)) return res.status(400).json({ error: "Invalid IMDb ID" });

    const [title, creditsPayload, videosPayload, releaseDatesPayload] = await Promise.all([
      fetchImdbTitleById(imdbId),
      fetchImdbTitleCredits(imdbId),
      fetchImdbTitleVideos(imdbId),
      fetchImdbTitleReleaseDates(imdbId),
    ]);

    if (!title) return res.status(404).json({ error: "Movie not found" });

    const { releaseDate, isReleased } = getIndiaReleaseDetails(releaseDatesPayload);
    const backdrop = getBackdropFromVideos(videosPayload) || title.primaryImage?.url || "";

    const insight = formatMovieInsight(title, imdbId, {
      year: String(title.startYear ?? "Unknown"),
      releaseDate,
      isReleased,
      backdrop,
      credits: Array.isArray(creditsPayload?.credits) ? creditsPayload.credits : [],
    });

    return res.status(200).json({ data: insight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch movie";
    return res.status(500).json({ error: message });
  }
}

export async function getMovieGenresByImdbId(req, res) {
  try {
    const imdbId = typeof req.params?.imdbId === "string" ? req.params.imdbId.trim().toLowerCase() : "";
    if (!IMDB_ID_REGEX.test(imdbId)) return res.status(400).json({ error: "Invalid IMDb ID" });

    const movie = await fetchImdbTitleGenresById(imdbId);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    return res.status(200).json({ data: { imdbId: movie.id, title: movie.title, type: movie.type, genres: movie.genres } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch movie genres";
    return res.status(500).json({ error: message });
  }
}

export async function getPersonalMovieSelection(req, res) {
  try {
    const user = req.user ? await User.findById(req.user._id) : null;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!isPersonalSelectionFresh(user.personalSelection)) {
      const items = await generateWeeklyPersonalSelection(user, normalizeSearchHistoryList(req.body?.searchHistory));
      const updatedAt = new Date();
      user.personalSelection = { items, updatedAt, refreshAfter: new Date(updatedAt.getTime() + PERSONAL_SELECTION_TTL_DAYS * 86_400_000) };
      await user.save();
    }

    return res.status(200).json({ data: { personalSelection: buildPersonalSelectionPayload(user.personalSelection) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch personal selections";
    return res.status(500).json({ error: message });
  }
}

export async function getMovieAiInsight(req, res) {
  try {
    const imdbId = typeof req.params?.imdbId === "string" ? req.params.imdbId.trim().toLowerCase() : "";
    if (!IMDB_ID_REGEX.test(imdbId)) return res.status(400).json({ error: "Invalid IMDb ID" });

    const title = typeof req.query?.title === "string" ? req.query.title.trim() : "";
    const insight = await getStoredMovieAiInsight(imdbId, title);
    return res.status(200).json({ data: insight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch movie insight";
    return res.status(500).json({ error: message });
  }
}
