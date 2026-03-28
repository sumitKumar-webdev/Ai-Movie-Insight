import {
  ApiResponse,
  AssistantMessage,
  AssistantSuggestion,
  MovieAiInsight,
  MovieDetails,
  MovieSearchItem,
  RepliesPayload,
  Review,
  ReviewShareCardPayload,
} from "../modal/service.modal";
import { apiFetch, authenticatedFetch, buildApiUrl } from "./api-client";

const IMDB_ID_REGEX = /^tt\d{7,8}$/i;
const movieSearchCache = new Map<string, MovieSearchItem[]>(); //TODO: replace with redis in future
const movieDetailsRequests = new Map<string, Promise<MovieDetails>>();
const movieInsightRequests = new Map<string, Promise<MovieAiInsight>>();
const movieReviewsRequests = new Map<string, Promise<Review[]>>();

export async function searchMovies(
  query: string,
  options: { signal?: AbortSignal } = {},
): Promise<MovieSearchItem[]> {
  const normalized = query.trim();
  if (normalized.length < 4) return [];

  const cachedResults = movieSearchCache.get(normalized);
  if (cachedResults) {
    return cachedResults;
  }

  try {
    const response = await fetch(
      buildApiUrl(`/api/movies/search?q=${encodeURIComponent(normalized)}`),
      { cache: "no-store", signal: options.signal },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: MovieSearchItem[] };
    const results = Array.isArray(payload.data) ? payload.data : [];
    movieSearchCache.set(normalized, results);
    return results;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    return [];
  }
}

export async function getMovieByImdbId(imdbId: string): Promise<MovieDetails> {
  const normalized = imdbId.trim().toLowerCase();
  if (!IMDB_ID_REGEX.test(normalized)) throw new Error("Invalid IMDb ID");

  const existingRequest = movieDetailsRequests.get(normalized);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const response = await fetch(
      buildApiUrl(`/api/movies/${encodeURIComponent(normalized)}`),
      { cache: "no-store" },
    );
    const payload = (await response.json()) as {
      data?: MovieDetails;
      error?: string;
    };
    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? "Movie not found");
    }
    return payload.data;
  })();

  movieDetailsRequests.set(normalized, request);

  try {
    return await request;
  } finally {
    movieDetailsRequests.delete(normalized);
  }
}

export async function getMovieAiInsightByImdbId(
  imdbId: string,
): Promise<MovieAiInsight> {
  const normalized = imdbId.trim().toLowerCase();
  if (!IMDB_ID_REGEX.test(normalized)) throw new Error("Invalid IMDb ID");

  const existingRequest = movieInsightRequests.get(normalized);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const response = await fetch(
      buildApiUrl(`/api/movies/${encodeURIComponent(normalized)}/insight`),
      { cache: "no-store" },
    );
    const payload = (await response.json()) as {
      data?: MovieAiInsight;
      error?: string;
    };
    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? "Movie insight not found");
    }
    return payload.data;
  })();

  movieInsightRequests.set(normalized, request);

  try {
    return await request;
  } finally {
    movieInsightRequests.delete(normalized);
  }
}

export async function getMovieReviews(imdbId: string): Promise<Review[]> {
  const normalized = imdbId.trim().toLowerCase();
  if (!IMDB_ID_REGEX.test(normalized)) return [];

  const existingRequest = movieReviewsRequests.get(normalized);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const response = await apiFetch(
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
  })();

  movieReviewsRequests.set(normalized, request);

  try {
    return await request;
  } finally {
    movieReviewsRequests.delete(normalized);
  }
}

export async function getReviewReplies(
  reviewId: string,
): Promise<{ ok: boolean; status: number; message?: string; data?: RepliesPayload }> {
  const response = await authenticatedFetch(`/api/reviews/${reviewId}/replies`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<RepliesPayload>;

  return {
    ok: response.ok,
    status: response.status,
    message: payload.message,
    data: payload.data,
  };
}

export async function getReviewShareCard(
  reviewId: string,
): Promise<{ ok: boolean; status: number; message?: string; data?: ReviewShareCardPayload }> {
  const response = await apiFetch(`/api/reviews/${reviewId}/share-card`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<{ shareCard?: ReviewShareCardPayload }>;

  return {
    ok: response.ok,
    status: response.status,
    message: payload.message,
    data: payload.data?.shareCard,
  };
}

export async function saveReviewReply(
  reviewId: string,
  message: string,
  options: {
    replyId?: string;
    replyToReplyId?: string;
  } = {},
): Promise<{ ok: boolean; status: number; message?: string }> {
  const endpoint = options.replyId
    ? `/api/reviews/${reviewId}/replies/${options.replyId}`
    : `/api/reviews/${reviewId}/replies`;
  const response = await authenticatedFetch(endpoint, {
    method: options.replyId ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      replyToReplyId: options.replyToReplyId,
    }),
  });

  const payload = (await response.json()) as ApiResponse;

  return {
    ok: response.ok,
    status: response.status,
    message: payload.message,
  };
}

export async function likeReviewReply(
  reviewId: string,
  replyId: string,
): Promise<{
  ok: boolean;
  status: number;
  message?: string;
  data?: { totalLikes?: number; likedByUser?: boolean };
}> {
  const response = await authenticatedFetch(
    `/api/reviews/${reviewId}/replies/${replyId}/likes`,
    {
      method: "POST",
    },
  );

  const payload = (await response.json()) as ApiResponse;

  return {
    ok: response.ok,
    status: response.status,
    message: payload.message,
    data: payload.data,
  };
}

export async function deleteReviewReply(
  reviewId: string,
  replyId: string,
): Promise<{ ok: boolean; status: number; message?: string }> {
  const response = await authenticatedFetch(`/api/reviews/${reviewId}/replies/${replyId}`, {
    method: "DELETE",
  });

  const payload = (await response.json()) as ApiResponse;

  return {
    ok: response.ok,
    status: response.status,
    message: payload.message,
  };
}

export async function chatWithAssistant(
  messages: Pick<AssistantMessage, "role" | "content">[],
): Promise<{ reply: string; suggestions: AssistantSuggestion[] }> {
  const response = await authenticatedFetch("/api/movies/assistant", {
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
    suggestions: Array.isArray(payload.data.suggestions)
      ? payload.data.suggestions
      : [],
  };
}
