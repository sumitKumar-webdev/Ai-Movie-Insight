import {
  ApiResponse,
  RepliesPayload,
  Review,
  ReviewShareCardPayload,
} from "../models/service.modal";
import { apiFetch, authenticatedFetch, buildApiUrl } from "./api-client";

const IMDB_ID_REGEX = /^tt\d{7,8}$/i;
const movieReviewsRequests = new Map<string, Promise<Review[]>>();

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

export async function saveReview(
  payload: {
    message: string;
    movieImdbId: string;
    movieTitle: string;
    reviewId?: string;
  },
): Promise<{ ok: boolean; status: number; message?: string; review?: Review }> {
  const response = await authenticatedFetch(
    payload.reviewId ? `/api/reviews/${payload.reviewId}` : "/api/reviews",
    {
      method: payload.reviewId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: payload.message,
        movieImdbId: payload.movieImdbId,
        movieTitle: payload.movieTitle,
      }),
    },
  );

  const data = (await response.json()) as ApiResponse<{ review?: Review }>;

  return {
    ok: response.ok,
    status: response.status,
    message: data.message,
    review: data.data?.review,
  };
}

export async function deleteReview(
  reviewId: string,
): Promise<{ ok: boolean; status: number; message?: string }> {
  const response = await authenticatedFetch(`/api/reviews/${reviewId}`, {
    method: "DELETE",
  });

  const data = (await response.json()) as ApiResponse;

  return {
    ok: response.ok,
    status: response.status,
    message: data.message,
  };
}

export async function likeReview(
  reviewId: string,
): Promise<{
  ok: boolean;
  status: number;
  message?: string;
  data?: { totalLikes?: number; likedByUser?: boolean };
}> {
  const response = await authenticatedFetch(`/api/reviews/${reviewId}/likes`, {
    method: "POST",
  });

  const data = (await response.json()) as ApiResponse<{
    totalLikes?: number;
    likedByUser?: boolean;
  }>;

  return {
    ok: response.ok,
    status: response.status,
    message: data.message,
    data: data.data,
  };
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
