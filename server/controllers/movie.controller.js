import { fetchImdbTitleById, fetchImdbTitleReleaseDates, fetchImdbTitleVideos, searchMoviesByQuery } from "../lib/movie.js";
import { chatWithMovieAssistant } from "../lib/openai.js";
import { getStoredMovieAiInsight } from "./movie-insight.controller.js";

const IMDB_ID_REGEX = /^tt\d{7,8}$/i;

function normalizeSuggestionQuery(value) {
  return String(value ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b\d{4}\b/g, " ")
    .replace(/[":]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMentionedTitles(reply) {
  const text = String(reply ?? "").trim();
  if (!text) return [];

  const matches = [];
  const patterns = [
    /"([^"\n]{2,80})"/g,
    /\*([^*\n]{2,80})\*/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const title = normalizeSuggestionQuery(match[1]);
      if (title) {
        matches.push(title);
      }
    }
  }

  return Array.from(new Set(matches)).slice(0, 3);
}

function buildSearchFallbackQueries(query) {
  const normalizedQuery = normalizeSuggestionQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  const compactQuery = normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");

  return Array.from(
    new Set([
      normalizedQuery,
      normalizedQuery.split("-")[0]?.trim() || "",
      normalizedQuery.split(":")[0]?.trim() || "",
      normalizedQuery.split(",")[0]?.trim() || "",
      compactQuery,
    ].filter(Boolean)),
  );
}

function isGeminiQuotaError(message) {
  const normalized = String(message ?? "").toLowerCase();
  return (
    normalized.includes("quota exceeded") ||
    normalized.includes("rate-limit") ||
    normalized.includes("rate limits") ||
    normalized.includes("generate_content_free_tier_requests")
  );
}

function buildQuotaFallbackReply(userMessage) {
  const normalizedMessage = String(userMessage ?? "").replace(/\s+/g, " ").trim();
  return normalizedMessage
    ? `admin ka ghee khatam h 30s baad try karna jab tak ye try kar lo: "${normalizedMessage}" based kuch picks dekh lo.`
    : "admin ka ghee khatam h 30s baad try karna jab tak ye try kar lo.";
}

async function collectSuggestionResults(queries) {
  const suggestionResults = [];
  const seenIds = new Set();

  for (const rawQuery of queries) {
    const query = normalizeSuggestionQuery(rawQuery);
    if (!query) continue;

    const candidates = Array.from(
      new Set([
        query,
        query.split("-")[0]?.trim() || "",
        query.split(",")[0]?.trim() || "",
      ].filter(Boolean)),
    );

    for (const candidate of candidates) {
      const results = await searchMoviesByQuery(candidate, { limit: 1 });
      const bestResult = results.find(
        (result) => result?.imdbId && !seenIds.has(result.imdbId),
      );

      if (bestResult) {
        seenIds.add(bestResult.imdbId);
        suggestionResults.push(bestResult);
        break;
      }
    }

    if (suggestionResults.length >= 3) {
      return suggestionResults;
    }
  }

  return suggestionResults;
}

function formatRuntime(runtimeSeconds) {
  if (!runtimeSeconds || runtimeSeconds <= 0) return "N/A";

  const totalMinutes = Math.round(runtimeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function joinNames(items) {
  const value = (items ?? [])
    .map((item) => item?.name?.trim() || "")
    .filter(Boolean)
    .join(", ");

  return value || "Unknown";
}

function uniquePeople(people) {
  const seen = new Set();
  const result = [];

  for (const person of people ?? []) {
    const id = person?.id?.trim();
    const name = person?.displayName?.trim();

    if (!id || !name || seen.has(id)) continue;

    seen.add(id);
    result.push({
      id,
      name,
      imageUrl: person?.primaryImage?.url?.trim() || null,
      professions: Array.isArray(person?.primaryProfessions)
        ? person.primaryProfessions
        : [],
    });
  }

  return result;
}

function mergeCrew(directors, writers) {
  return uniquePeople([...(directors ?? []), ...(writers ?? [])]);
}

function getBackdropFromVideos(payload) {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  for (const preferredType of ["trailer", "teaser", "clip"]) {
    const match = videos.find(
      (video) =>
        video?.type === preferredType &&
        typeof video?.primaryImage?.url === "string" &&
        video.primaryImage.url.trim(),
    );

    if (match) {
      return match.primaryImage.url.trim();
    }
  }

  return "";
}

function getIndiaReleaseDetails(payload) {
  const releaseDates = Array.isArray(payload?.releaseDates) ? payload.releaseDates : [];
  const indiaRelease = releaseDates.find(
    (item) =>
      (item?.country?.code === "IN" || item?.country?.name === "India") &&
      typeof item?.releaseDate?.year === "number",
  );

  if (!indiaRelease?.releaseDate?.year) {
    return {
      releaseDate: "N/A",
      isReleased: false,
    };
  }

  const { year, month, day } = indiaRelease.releaseDate;
  const monthName =
    typeof month === "number"
      ? new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-GB", { month: "long" })
      : null;
  const releaseDate =
    typeof day === "number" && monthName && typeof year === "number"
      ? `${day} ${monthName} ${year}`
      : [day, monthName, year].filter(Boolean).join(" ");

  let isReleased = true;
  if (typeof year === "number") {
    if (typeof month === "number" && typeof day === "number") {
      const releaseUtc = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
      isReleased = releaseUtc <= Date.now();
    } else {
      isReleased = year <= new Date().getUTCFullYear();
    }
  }

  return {
    releaseDate,
    isReleased,
  };
}

function formatMovieInsight(title, fallbackImdbId, options = {}) {
  const cast = uniquePeople(title.stars);
  const crew = mergeCrew(title.directors, title.writers);

  return {
    imdbId: title.id ?? fallbackImdbId,
    title: title.primaryTitle ?? `Movie ${fallbackImdbId}`,
    year:
      (typeof options.year === "string" ? options.year.trim() : "")
      || String(title.startYear ?? "Unknown"),
    type: title.type,
    releaseDate: options.releaseDate?.trim() || "N/A",
    isReleased: options.isReleased ?? false,
    runtime: formatRuntime(title.runtimeSeconds),
    rating: title.rating?.aggregateRating?.toFixed(1) ?? "N/A",
    language: joinNames(title.spokenLanguages),
    country: joinNames(title.originCountries),
    ageRating:
      (typeof title.contentRating === "string" ? title.contentRating.trim() : "") || "N/A",
    poster: title.primaryImage?.url ?? "",
    backdrop:
      (typeof options.backdrop === "string" ? options.backdrop.trim() : "")
      || title.primaryImage?.url
      || "",
    overview: title.plot?.trim() || "Overview unavailable.",
    genres: Array.isArray(title.genres) ? title.genres : [],
    cast,
    crew,
  };
}

export async function searchMovies(req, res) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) {
      return res.status(200).json({ data: [] });
    }

    let data = [];
    const fallbackQueries = buildSearchFallbackQueries(query);

    for (const candidate of fallbackQueries) {
      data = await searchMoviesByQuery(candidate, { limit: 25 });
      if (Array.isArray(data) && data.length > 0) {
        break;
      }
    }

    return res.status(200).json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search movies";
    console.error("[movie:search]", message);
    return res.status(500).json({ error: message });
  }
}

export async function chatMovieAssistant(request, response) {
  try {
    const { messages } = request.body
    const sanitizedMessages = (messages ?? [])
      .map((message) => ({
        role: message?.role === "assistant" ? "assistant" : "user",
        content: typeof message?.content === "string" ? message.content.trim() : "",
      }))
      .filter((message) => message.content);

    if (sanitizedMessages.length === 0) {
      return response.status(400).json({ error: "At least one message is required" });
    }

    let aiResult = null;
    let aiErrorMessage = "";
    let isQuotaLimited = false;
    const latestUserMessage =
      [...sanitizedMessages].reverse().find((message) => message.role === "user")?.content || "";

    try {
      aiResult = await chatWithMovieAssistant(sanitizedMessages);
    } catch (error) {
      aiErrorMessage =
        error instanceof Error ? error.message : "Failed to chat with movie assistant";
      isQuotaLimited =
        (error instanceof Error && error.code === "GEMINI_QUOTA_EXCEEDED") ||
        isGeminiQuotaError(aiErrorMessage);

      if (isQuotaLimited) {
        aiErrorMessage = buildQuotaFallbackReply(latestUserMessage);
      }
    }
    let suggestionQueries = aiResult?.suggestions?.length
      ? aiResult.suggestions
      : extractMentionedTitles(aiResult?.reply);

    if (!suggestionQueries.length && isQuotaLimited && latestUserMessage) {
      suggestionQueries = buildSearchFallbackQueries(latestUserMessage);
    }

    let suggestionResults = await collectSuggestionResults(suggestionQueries);

    return response.status(200).json({
      data: {
        reply: aiResult?.reply ||
          (isQuotaLimited
            ? aiErrorMessage
            : suggestionResults.length > 0
              ? "Here are a few picks you might enjoy."
              : aiErrorMessage || "Failed, please try again."),
        suggestions: suggestionResults,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to chat with movie assistant";
    return response.status(500).json({ error: message });
  }
}

export async function getMovieByImdbId(request, response) {
  try {
    const imdbId =
      typeof request.params?.imdbId === "string"
        ? request.params.imdbId.trim().toLowerCase()
        : "";
    if (!IMDB_ID_REGEX.test(imdbId)) return response.status(400).json({ error: "Invalid IMDb ID" });

    const [title, videosPayload, releaseDatesPayload] = await Promise.all([
      fetchImdbTitleById(imdbId),
      fetchImdbTitleVideos(imdbId),
      fetchImdbTitleReleaseDates(imdbId),
    ]);

    if (!title) {
      return response.status(404).json({ error: "Movie not found" });
    }

    const indiaRelease = getIndiaReleaseDetails(releaseDatesPayload);
    const backdropFromVideos = getBackdropFromVideos(videosPayload);

    const insight = formatMovieInsight(title, imdbId, {
      year: String(title.startYear ?? "Unknown"),
      releaseDate: indiaRelease.releaseDate,
      isReleased: indiaRelease.isReleased,
      backdrop: backdropFromVideos || title.primaryImage?.url || "",
    });

    const aiInsight = await getStoredMovieAiInsight(imdbId, insight.title);
    insight.summary = aiInsight.summary;
    insight.sentiment = aiInsight.sentiment;
    insight.confidence = aiInsight.confidence;
    insight.communityReviews = aiInsight.communityReviews;

    return response.status(200).json({ data: insight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch movie";
    return response.status(500).json({ error: message });
  }
}

export async function getMovieAiInsight(request, response) {
  try {
    const imdbId =
      typeof request.params?.imdbId === "string"
        ? request.params.imdbId.trim().toLowerCase()
        : "";

    if (!IMDB_ID_REGEX.test(imdbId)) {
      return response.status(400).json({ error: "Invalid IMDb ID" });
    }

    const title =
      typeof request.query?.title === "string" && request.query.title.trim()
        ? request.query.title.trim()
        : "";

    const insight = await getStoredMovieAiInsight(imdbId, title);
    return response.status(200).json({ data: insight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch movie insight";
    return response.status(500).json({ error: message });
  }
}
