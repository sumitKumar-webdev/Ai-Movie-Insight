import { fetchImdbTitleById, fetchImdbTitleReleaseDates, fetchImdbTitleVideos, searchMoviesByQuery } from "../lib/movie.js";
import { chatWithMovieAssistant, summarizeWithOpenAI } from "../lib/openai.js";
import Review from "../models/Review.js";

const IMDB_ID_REGEX = /^tt\d{7,8}$/i;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const releaseDate = [year, month, day]
    .filter((value) => typeof value === "number")
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, "0")))
    .join("/");

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
  const resolvedYear =
    typeof options.year === "string" && options.year.trim()
      ? options.year.trim()
      : String(title.startYear ?? "Unknown");
  const resolvedBackdrop =
    typeof options.backdrop === "string" && options.backdrop.trim()
      ? options.backdrop.trim()
      : title.primaryImage?.url || "";

  return {
    imdbId: title.id ?? fallbackImdbId,
    title: title.primaryTitle ?? `Movie ${fallbackImdbId}`,
    year: resolvedYear,
    type: title.type,
    releaseDate: options.releaseDate?.trim() || "N/A",
    isReleased: options.isReleased ?? false,
    runtime: formatRuntime(title.runtimeSeconds),
    rating: title.rating?.aggregateRating?.toFixed(1) ?? "N/A",
    language: joinNames(title.spokenLanguages),
    country: joinNames(title.originCountries),
    ageRating:
      typeof title.contentRating === "string" && title.contentRating.trim()
        ? title.contentRating.trim()
        : "N/A",
    poster: title.primaryImage?.url ?? "",
    backdrop: resolvedBackdrop,
    overview: title.plot?.trim() || "Overview unavailable.",
    genres: Array.isArray(title.genres) ? title.genres : [],
    cast,
    crew,
    summary: "No community reviews yet. Be the first to share what you thought about this movie.",
    sentiment: "NoReviews",
    confidence: 0,
    reviews: [],
    communityReviews: [],
  };
}

function formatCommunityReview(review) {
  const author =
    typeof review?.user?.username === "string" && review.user.username.trim()
      ? review.user.username.trim()
      : typeof review?.user?.name === "string" && review.user.name.trim()
        ? review.user.name.trim()
        : "User";
  const message =
    typeof review?.message === "string" && review.message.trim() ? review.message.trim() : "";

  return {
    _id: String(review?._id ?? ""),
    author,
    text: message,
    date: review?.createdAt ? new Date(review.createdAt).toISOString() : "",
    imageUrl: null,
    likes: Number(review?.likes ?? 0),
    userId: review?.user?._id ? String(review.user._id) : null,
    replies: Array.isArray(review?.replies)
      ? review.replies.map((reply) => ({
        _id: String(reply?._id ?? ""),
        author:
          typeof reply?.user?.username === "string" && reply.user.username.trim()
            ? reply.user.username.trim()
            : typeof reply?.user?.name === "string" && reply.user.name.trim()
              ? reply.user.name.trim()
              : "User",
        text:
          typeof reply?.message === "string" && reply.message.trim()
            ? reply.message.trim()
            : "",
        date: reply?.createdAt ? new Date(reply.createdAt).toISOString() : "",
        userId: reply?.user?._id ? String(reply.user._id) : null,
      }))
      : [],
  };
}

async function buildMovieAiInsight(imdbId, title) {
  const communityReviews = await Review.find({
    movieImdbId: { $regex: `^${escapeRegex(imdbId)}$`, $options: "i" },
  })
    .sort({ createdAt: -1 })
    .populate("user", "name username")
    .populate("replies.user", "name username")
    .select("movieImdbId movieTitle message likes createdAt user replies")
    .lean();

  const formattedReviews = communityReviews.map(formatCommunityReview).filter((review) => review.text);
  const reviewTexts = communityReviews
    .map((review) => (typeof review?.message === "string" ? review.message.trim() : ""))
    .filter(Boolean);

  const fallbackTitle =
    typeof title === "string" && title.trim()
      ? title.trim()
      : communityReviews.find((review) => typeof review?.movieTitle === "string" && review.movieTitle.trim())
        ?.movieTitle?.trim() || `Movie ${imdbId}`;

  const insight = {
    imdbId,
    title: fallbackTitle,
    summary: "No community reviews yet. Be the first to share what you thought about this movie.",
    sentiment: "NoReviews",
    confidence: 0,
    communityReviews: formattedReviews,
  };

  if (reviewTexts.length === 0) {
    return insight;
  }

  const joinedReviews = reviewTexts
    .slice(0, 10)
    .map((text, index) => `Review ${index + 1}: ${text}`)
    .join("\n\n");

  const ai = await summarizeWithOpenAI(
    fallbackTitle,
    joinedReviews,
    "reviews",
  ).catch(() => null);

  if (ai?.summary) {
    insight.summary = ai.summary;
    insight.confidence = ai.confidence;
    insight.sentiment = ai.sentiment ?? "Mixed";
  }

  return insight;
}

export async function searchMovies(req, res) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) {
      return res.status(200).json({ data: [] });
    }
    const data = await searchMoviesByQuery(query, { limit: 25 });

    return res.status(200).json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search movies";
    return res.status(500).json({ error: message });
  }
}

export async function chatMovieAssistant(request, response) {
  try {
    const body = request.body ?? {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const sanitizedMessages = messages
      .map((message) => ({
        role: message?.role === "assistant" ? "assistant" : "user",
        content: typeof message?.content === "string" ? message.content.trim() : "",
      }))
      .filter((message) => message.content);

    if (sanitizedMessages.length === 0) {
      return response.status(400).json({ error: "At least one message is required" });
    }

    const latestUserMessage = [...sanitizedMessages]
      .reverse()
      .find((message) => message.role === "user");

    let aiResult = null;
    let aiErrorMessage = "";

    try {
      aiResult = await chatWithMovieAssistant(sanitizedMessages);
    } catch (error) {
      aiErrorMessage =
        error instanceof Error ? error.message : "Failed to chat with movie assistant";
      console.error("[movie:assistant]", aiErrorMessage);
    }
    const suggestionQueries =
      aiResult?.suggestions?.length
        ? aiResult.suggestions
        : latestUserMessage?.content
          ? [latestUserMessage.content]
          : [];

    const suggestionResults = [];
    const seenIds = new Set();

    for (const query of suggestionQueries) {
      const results = await searchMoviesByQuery(query, { limit: 5 });
      for (const result of results) {
        if (!result?.imdbId || seenIds.has(result.imdbId)) continue;
        seenIds.add(result.imdbId);
        suggestionResults.push(result);
        if (suggestionResults.length >= 3) break;
      }
      if (suggestionResults.length >= 3) break;
    }

    return response.status(200).json({
      data: {
        reply: aiResult?.reply ||
          (suggestionResults.length > 0
            ? "Admin ka ghee khatam h aap ye dekh lo"
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

    const aiInsight = await buildMovieAiInsight(imdbId, insight.title);
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

    const insight = await buildMovieAiInsight(imdbId, title);
    return response.status(200).json({ data: insight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch movie insight";
    return response.status(500).json({ error: message });
  }
}
