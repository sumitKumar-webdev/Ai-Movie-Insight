import {
  NameFilmographyResponse,
  NameProfile,
} from "../models/service.modal";
import { buildApiUrl } from "./api-client";

const IMDB_NAME_ID_REGEX = /^nm\d{7,8}$/i;
const nameProfileRequests = new Map<string, Promise<NameProfile>>();

export async function getNameById(nameId: string): Promise<NameProfile> {
  const normalized = nameId.trim().toLowerCase();
  if (!IMDB_NAME_ID_REGEX.test(normalized)) {
    throw new Error("Invalid IMDb name ID");
  }

  const existingRequest = nameProfileRequests.get(normalized);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const response = await fetch(
      buildApiUrl(`/api/names/${encodeURIComponent(normalized)}`),
      { cache: "no-store" },
    );
    const payload = (await response.json()) as {
      data?: NameProfile;
      error?: string;
    };

    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? "Person not found");
    }

    return payload.data;
  })();

  nameProfileRequests.set(normalized, request);

  try {
    return await request;
  } finally {
    nameProfileRequests.delete(normalized);
  }
}

export async function getNameFilmography(
  nameId: string,
  options: {
    categories?: string[];
    pageToken?: string;
    pageSize?: number;
  } = {},
): Promise<NameFilmographyResponse> {
  const normalized = nameId.trim().toLowerCase();
  if (!IMDB_NAME_ID_REGEX.test(normalized)) {
    throw new Error("Invalid IMDb name ID");
  }

  const params = new URLSearchParams();

  options.categories?.forEach((category) => {
    const normalizedCategory = category.trim();
    if (normalizedCategory) {
      params.append("categories", normalizedCategory);
    }
  });

  params.set("pageSize", String(options.pageSize ?? 10));

  if (options.pageToken?.trim()) {
    params.set("pageToken", options.pageToken.trim());
  }

  const query = params.toString();
  const response = await fetch(
    buildApiUrl(
      `/api/names/${encodeURIComponent(normalized)}/filmography${query ? `?${query}` : ""}`,
    ),
    { cache: "no-store" },
  );
  const payload = (await response.json()) as {
    data?: NameFilmographyResponse;
    error?: string;
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "Failed to fetch filmography");
  }

  return {
    credits: Array.isArray(payload.data.credits) ? payload.data.credits : [],
    totalCount:
      typeof payload.data.totalCount === "number" ? payload.data.totalCount : 0,
    nextPageToken:
      typeof payload.data.nextPageToken === "string"
        ? payload.data.nextPageToken
        : undefined,
  };
}
