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

function appendQueryValues(params, key, values) {
    values.forEach((value) => {
        const normalized = typeof value === "string" ? value.trim() : "";
        if (normalized) {
            params.append(key, normalized);
        }
    });
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

export async function fetchImdbTitleGenresById(imdbId) {
    const data = await fetchJson(
        `${IMDB_API_BASE_URL}/titles/${encodeURIComponent(imdbId)}`,
    ).catch(() => null);

    if (!data?.id) {
        return null;
    }

    return {
        id: data.id,
        title: data.primaryTitle || data.originalTitle || data.id,
        genres: Array.isArray(data.genres) ? data.genres : [],
        type: data.type || "movie",
    };
}

export async function fetchImdbTitleVideos(imdbId) {
    return fetchJson(
        `${IMDB_API_BASE_URL}/titles/${encodeURIComponent(imdbId)}/videos`,
    ).catch(() => null);
}

export async function fetchImdbTitleCredits(imdbId) {
    return fetchJson(
        `${IMDB_API_BASE_URL}/titles/${encodeURIComponent(imdbId)}/credits`,
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

export async function listImdbTitles(filters = {}) {
    const params = new URLSearchParams();
    const pageSize =
        typeof filters.pageSize === "number" && filters.pageSize >= 1 && filters.pageSize <= 50
            ? filters.pageSize
            : undefined;

    appendQueryValues(params, "types", Array.isArray(filters.types) ? filters.types : []);
    appendQueryValues(params, "genres", Array.isArray(filters.genres) ? filters.genres : []);
    appendQueryValues(
        params,
        "countryCodes",
        Array.isArray(filters.countryCodes) ? filters.countryCodes : [],
    );
    appendQueryValues(
        params,
        "languageCodes",
        Array.isArray(filters.languageCodes) ? filters.languageCodes : [],
    );
    appendQueryValues(params, "nameIds", Array.isArray(filters.nameIds) ? filters.nameIds : []);
    appendQueryValues(
        params,
        "interestIds",
        Array.isArray(filters.interestIds) ? filters.interestIds : [],
    );

    const scalarEntries = [
        ["startYear", filters.startYear],
        ["endYear", filters.endYear],
        ["minVoteCount", filters.minVoteCount],
        ["maxVoteCount", filters.maxVoteCount],
        ["minAggregateRating", filters.minAggregateRating],
        ["maxAggregateRating", filters.maxAggregateRating],
        ["sortBy", filters.sortBy],
        ["sortOrder", filters.sortOrder],
        ["pageSize", pageSize],
        ["pageToken", filters.pageToken],
    ];

    scalarEntries.forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            params.set(key, String(value).trim());
        }
    });

    const payload = await fetchJson(
        `${IMDB_API_BASE_URL}/titles${params.toString() ? `?${params.toString()}` : ""}`,
    ).catch(() => null);

    const titles = Array.isArray(payload?.titles) ? payload.titles : [];

    return {
        items: titles
            .map((item) => ({
                imdbId: item?.id ?? "",
                title: item?.primaryTitle || item?.originalTitle || item?.id,
                year:
                    typeof item?.startYear === "number" ? String(item.startYear) : "N/A",
                poster: item?.primaryImage?.url ?? null,
                type: item?.type || "movie",
                genres: Array.isArray(item?.genres) ? item.genres : [],
            }))
            .filter((item) => item.imdbId),
        nextPageToken:
            typeof payload?.nextPageToken === "string" && payload.nextPageToken.trim()
                ? payload.nextPageToken.trim()
                : undefined,
    };
}
