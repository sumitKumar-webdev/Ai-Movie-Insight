import {
  AssistantMessage,
  AssistantSuggestion,
  MovieAiInsight,
  MovieInsight,
  MovieSearchItem,
  Review,
} from "../modal/service.modal";
import { buildApiUrl } from "./api-client";

const IMDB_ID_REGEX = /^tt\d{7,8}$/i;

export async function searchMovies(query: string): Promise<MovieSearchItem[]> {
  const normalized = query.trim();
  if (!normalized) return [];

  try {
    const response = await fetch(
      buildApiUrl(`/api/movies/search?q=${encodeURIComponent(normalized)}`),
      { cache: "no-store" },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: MovieSearchItem[] };
    return Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
}

export async function getMovieByImdbId(imdbId: string): Promise<MovieInsight> {
  const normalized = imdbId.trim().toLowerCase();
  if (!IMDB_ID_REGEX.test(normalized)) throw new Error("Invalid IMDb ID");

  const response = await fetch(
    buildApiUrl(`/api/movies/${encodeURIComponent(normalized)}`),
    { cache: "no-store" },
  );
  const payload = (await response.json()) as { data?: MovieInsight; error?: string };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "Movie not found");
  }
  return payload.data;
}

export async function getMovieAiInsightByImdbId(imdbId: string): Promise<MovieAiInsight> {
  const normalized = imdbId.trim().toLowerCase();
  if (!IMDB_ID_REGEX.test(normalized)) throw new Error("Invalid IMDb ID");

  const response = await fetch(
    buildApiUrl(`/api/movies/${encodeURIComponent(normalized)}/insight`),
    { cache: "no-store" },
  );
  const payload = (await response.json()) as { data?: MovieAiInsight; error?: string };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "Movie insight not found");
  }
  return payload.data;
}

export async function getMovieReviews(imdbId: string): Promise<Review[]> {
  const normalized = imdbId.trim().toLowerCase();
  if (!IMDB_ID_REGEX.test(normalized)) return [];

  try {
    const response = await fetch(
      buildApiUrl(`/api/reviews?imdbId=${encodeURIComponent(normalized)}`),
      { cache: "no-store" },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      data?: {
        reviews?: Review[];
      };
    };
    return Array.isArray(payload.data?.reviews) ? payload.data.reviews : [];
  } catch {
    return [];
  }
}

export async function chatWithAssistant(
  messages: Pick<AssistantMessage, "role" | "content">[],
): Promise<{ reply: string; suggestions: AssistantSuggestion[] }> {
  const response = await fetch(buildApiUrl("/api/movies/assistant"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const payload = (await response.json()) as {
    error?: string;
    data?: {
      reply?: string;
      suggestions?: AssistantSuggestion[];
    };
  };

  if (!response.ok || !payload.data?.reply) {
    throw new Error(payload.error ?? "Assistant request failed");
  }

  return {
    reply: payload.data.reply,
    suggestions: Array.isArray(payload.data.suggestions) ? payload.data.suggestions : [],
  };
}
