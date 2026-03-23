const IMDB_API_BASE_URL = process.env.IMDB_API_BASE_URL || "https://api.imdbapi.dev";
const FETCH_TIMEOUT_MS = Number(process.env.IMDB_API_TIMEOUT_MS || "10000");

export async function fetchJson(url) {
    const options =
        FETCH_TIMEOUT_MS > 0
            ? { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
            : { cache: "no-store" };

    const response = await fetch(url, options);
    if (!response.ok) {
        return null;
    }

    return response.json();
}

export async function fetchImdbTitleById(imdbId) {
    const data = await fetchJson(
        `${IMDB_API_BASE_URL}/titles/${encodeURIComponent(imdbId)}`,
    ).catch(() => null);

    if (!data?.id) {
        return null;
    }

    return data;
}

export async function fetchImdbTitleVideos(imdbId) {
    return fetchJson(
        `${IMDB_API_BASE_URL}/titles/${encodeURIComponent(imdbId)}/videos`,
    ).catch(() => null);
}

export async function fetchImdbTitleReleaseDates(imdbId) {
    const collectedReleaseDates = [];
    let pageToken = "";

    for (let index = 0; index < 5; index += 1) {
        const params = new URLSearchParams({ pageSize: "50" });
        if (pageToken) {
            params.set("pageToken", pageToken);
        }

        const payload = await fetchJson(
            `${IMDB_API_BASE_URL}/titles/${encodeURIComponent(imdbId)}/releaseDates?${params.toString()}`,
        ).catch(() => null);

        if (!payload) {
            break;
        }

        if (Array.isArray(payload.releaseDates)) {
            collectedReleaseDates.push(...payload.releaseDates);
        }

        const nextPageToken =
            (typeof payload.nextPageToken === "string" && payload.nextPageToken) ||
            (typeof payload.pageToken === "string" && payload.pageToken) ||
            "";

        if (!nextPageToken || nextPageToken === pageToken) {
            break;
        }

        pageToken = nextPageToken;
    }

    return {
        releaseDates: collectedReleaseDates,
    };
}

export async function searchMoviesByQuery(query, options = {}) {
    const normalizedQuery = typeof query === "string" ? query.trim() : "";
    if (!normalizedQuery) return [];

    const limit =
        typeof options.limit === "number" && options.limit > 0 ? options.limit : 20;
    const payload = await fetchJson(
        `${IMDB_API_BASE_URL}/search/titles?query=${encodeURIComponent(normalizedQuery)}`,
    ).catch(() => null);

    const titles = Array.isArray(payload?.titles) ? payload.titles : [];
    return titles
        .map((item) => ({
            imdbId: item.id ?? '',
            title: item.originalTitle || item.primaryTitle || item.id,
            year: String(item?.startYear) ?? 'N/A',
            poster: item?.primaryImage?.url ?? null,
            type: item.type || "movie",
        }))
        .filter(Boolean)
        .slice(0, limit);
}
