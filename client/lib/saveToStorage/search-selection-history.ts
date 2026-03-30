"use client";

import { MovieSearchItem } from "@/app/modal/service.modal";
import {
  getFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/saveToStorage/save-to-local-storage";

export type SavedSearchSelection = {
  imdbId: string;
  title: string;
};

const LOCAL_STORAGE_KEY = "movie_search_selection_history";
const MAX_HISTORY_ITEMS = 20;

function normalizeHistory(items: SavedSearchSelection[]) {
  const seenMovieIds = new Set<string>();

  return items
    .filter((item) => {
      const normalizedImdbId = item.imdbId?.trim().toLowerCase();
      const normalizedTitle = item.title?.trim();
      if (!normalizedImdbId || !normalizedTitle || seenMovieIds.has(normalizedImdbId)) {
        return false;
      }

      seenMovieIds.add(normalizedImdbId);
      return true;
    })
    .slice(0, MAX_HISTORY_ITEMS);
}

function getLocalSearchHistory() {
  const storedHistory = getFromLocalStorage<SavedSearchSelection[]>(
    LOCAL_STORAGE_KEY,
    [],
  );

  return Array.isArray(storedHistory) ? storedHistory : [];
}

export function getSelectedMovieSearchHistory() {
  return normalizeHistory(getLocalSearchHistory());
}

export function saveSelectedMovieToSearchHistory(movie: MovieSearchItem) {
  const imdbId = movie.imdbId?.trim();
  const movieTitle = movie.title?.trim();
  if (!imdbId || !movieTitle) {
    return;
  }

  const nextLocalHistory = normalizeHistory([
    {
      imdbId,
      title: movieTitle,
    },
    ...getLocalSearchHistory(),
  ]);

  saveToLocalStorage(LOCAL_STORAGE_KEY, nextLocalHistory);
}
