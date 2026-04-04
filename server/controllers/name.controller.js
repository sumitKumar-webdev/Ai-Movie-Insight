import { fetchImdbNameById, fetchImdbNameFilmography } from "../lib/name.js";

const IMDB_NAME_ID_REGEX = /^nm\d{7,8}$/i;

function formatDateParts(date) {
  if (!date || typeof date?.year !== "number") {
    return null;
  }

  const { year, month, day } = date;
  if (typeof month === "number" && typeof day === "number") {
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  if (typeof month === "number") {
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return String(year);
}

function normalizeProfessions(value) {
  return Array.isArray(value)
    ? value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
    : [];
}

function normalizeNamePayload(person) {
  const birthDate = formatDateParts(person?.birthDate);
  const deathDate = formatDateParts(person?.deathDate);

  return {
    id: person.id,
    name: person.displayName?.trim() || person.id,
    photo: person?.primaryImage?.url?.trim() || null,
    backdrop: null,
    professions: normalizeProfessions(person?.primaryProfessions),
    biography: typeof person?.biography === "string" ? person.biography.trim() : "",
    birthDate,
    birthLocation: typeof person?.birthLocation === "string" ? person.birthLocation.trim() || null : null,
    deathDate,
    deathLocation: typeof person?.deathLocation === "string" ? person.deathLocation.trim() || null : null,
    isDeceased: Boolean(deathDate),
  };
}

function normalizeFilmographyCredit(credit) {
  const title = credit?.title;
  const titleId = title?.id?.trim();
  if (!titleId) {
    return null;
  }

  return {
    id: titleId,
    categories:
      typeof credit?.category === "string" && credit.category.trim()
        ? [credit.category.trim()]
        : [],
    characters: Array.isArray(credit?.characters)
      ? credit.characters
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
      : [],
    episodeCount: typeof credit?.episodeCount === "number" ? credit.episodeCount : 0,
    title: {
      imdbId: titleId,
      type: typeof title?.type === "string" ? title.type.trim() : "movie",
      title: title?.primaryTitle?.trim() || title?.originalTitle?.trim() || titleId,
      poster: title?.primaryImage?.url?.trim() || null,
      year: typeof title?.startYear === "number" ? String(title.startYear) : "N/A",
      endYear: typeof title?.endYear === "number" ? String(title.endYear) : null,
      rating:
        typeof title?.rating?.aggregateRating === "number"
          ? Number(title.rating.aggregateRating.toFixed(1))
          : null,
    },
  };
}

function mergeFilmographyCredits(credits) {
  const merged = new Map();

  for (const rawCredit of Array.isArray(credits) ? credits : []) {
    const credit = normalizeFilmographyCredit(rawCredit);
    if (!credit) continue;

    const existing = merged.get(credit.title.imdbId);
    if (!existing) {
      merged.set(credit.title.imdbId, credit);
      continue;
    }

    for (const category of credit.categories) {
      if (category && !existing.categories.includes(category)) {
        existing.categories.push(category);
      }
    }

    for (const character of credit.characters) {
      if (character && !existing.characters.includes(character)) {
        existing.characters.push(character);
      }
    }

    if (credit.episodeCount > existing.episodeCount) {
      existing.episodeCount = credit.episodeCount;
    }
  }

  return Array.from(merged.values());
}

export async function getNameById(req, res) {
  try {
    const nameId = typeof req.params?.nameId === "string" ? req.params.nameId.trim().toLowerCase() : "";
    if (!IMDB_NAME_ID_REGEX.test(nameId)) {
      return res.status(400).json({ error: "Invalid IMDb name ID" });
    }

    const person = await fetchImdbNameById(nameId);
    if (!person) {
      return res.status(404).json({ error: "Person not found" });
    }

    return res.status(200).json({ data: normalizeNamePayload(person) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch person";
    return res.status(500).json({ error: message });
  }
}

export async function getNameFilmography(req, res) {
  try {
    const nameId = typeof req.params?.nameId === "string" ? req.params.nameId.trim().toLowerCase() : "";
    if (!IMDB_NAME_ID_REGEX.test(nameId)) {
      return res.status(400).json({ error: "Invalid IMDb name ID" });
    }

    const pageSizeRaw = Number(req.query.pageSize);
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(50, Math.max(1, pageSizeRaw))
      : 10;

    const categories = Array.isArray(req.query.categories)
      ? req.query.categories
      : typeof req.query.categories === "string"
        ? req.query.categories.split(",")
        : [];

    const payload = await fetchImdbNameFilmography(nameId, {
      categories,
      pageSize,
      pageToken: typeof req.query.pageToken === "string" ? req.query.pageToken.trim() : undefined,
    });

    if (!payload) {
      return res.status(404).json({ error: "Filmography not found" });
    }

    return res.status(200).json({
      data: {
        credits: mergeFilmographyCredits(payload.credits),
        totalCount: typeof payload.totalCount === "number" ? payload.totalCount : 0,
        nextPageToken:
          typeof payload.nextPageToken === "string" && payload.nextPageToken.trim()
            ? payload.nextPageToken.trim()
            : undefined,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch filmography";
    return res.status(500).json({ error: message });
  }
}
