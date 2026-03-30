"use client";

export type UserInterestedCategory = {
  category: string;
  count: number;
  movies: string[];
};

function normalizeGenreList(value: string[], limit: number) {
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

export async function getUserInterestedCategories(
  preferredGenres: string[] = [],
  limit = 5,
) {
  return normalizeGenreList(preferredGenres, Math.max(limit, 1)).map(
    (genre, index) => ({
      category: genre,
      count: Math.max(1, limit - index),
      movies: [],
    }),
  );
}
