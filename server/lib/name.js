import { fetchJson } from "./movie.js";

const IMDB_API_BASE_URL = process.env.IMDB_API_BASE_URL || "https://api.imdbapi.dev";

function appendQueryValues(params, key, values) {
  values.forEach((value) => {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (normalized) {
      params.append(key, normalized);
    }
  });
}

export async function fetchImdbNameById(nameId) {
  const data = await fetchJson(
    `${IMDB_API_BASE_URL}/names/${encodeURIComponent(nameId)}`,
  ).catch(() => null);

  if (!data?.id) {
    return null;
  }

  return data;
}

export async function fetchImdbNameFilmography(nameId, options = {}) {
  const params = new URLSearchParams();

  appendQueryValues(
    params,
    "categories",
    Array.isArray(options.categories) ? options.categories : [],
  );

  const pageSize =
    typeof options.pageSize === "number" && options.pageSize >= 1 && options.pageSize <= 50
      ? options.pageSize
      : 10;
  params.set("pageSize", String(pageSize));

  if (typeof options.pageToken === "string" && options.pageToken.trim()) {
    params.set("pageToken", options.pageToken.trim());
  }

  return fetchJson(
    `${IMDB_API_BASE_URL}/names/${encodeURIComponent(nameId)}/filmography?${params.toString()}`,
  ).catch(() => null);
}
