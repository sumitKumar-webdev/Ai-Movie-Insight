export const INDUSTRY_TO_COUNTRY = {
    bollywood: ["IN"],
    hollywood: ["US", "GB"],
    telugu: ["IN"],
    tamil: ["IN"],
    malayalam: ["IN"],
    kannada: ["IN"],
    korean: ["KR"],
    japanese: ["JP"],
    "south indian": ["IN"],
    international: ["FR", "ES", "IT", "DE", "CN"],
};

export const INDUSTRY_TO_LANGUAGE = {
    bollywood: ["hin"],
    hollywood: ["eng"],
    telugu: ["tel"],
    tamil: ["tam"],
    malayalam: ["mal"],
    kannada: ["kan"],
    korean: ["kor"],
    japanese: ["jpn"],
    "south indian": ["tel", "tam", "mal", "kan"],
    international: ["nor","fra",],
};

export const LANGUAGE_TO_CODE = {
    hindi: "hin",
    english: "eng",
    tamil: "tam",
    telugu: "tel",
    malayalam: "mal",
    kannada: "kan",
    korean: "kor",
    japanese: "jpn",
};

export const LANGUAGE_TO_INTEREST_ID = {
    hindi: "in0000222",
    english: "in0000219",
    tamil: "in0000235",
    telugu: "in0000236",
    malayalam: "in0000240",
    kannada: "in0000241",
    korean: "in0000225",
    japanese: "in0000224",
};

export const INDUSTRY_TO_INTEREST_IDS = {
    bollywood: ["in0000222"],
    hollywood: ["in0000219"],
    telugu: ["in0000236"],
    tamil: ["in0000235"],
    malayalam: ["in0000240"],
    kannada: ["in0000241"],
    korean: ["in0000225", "in0000209"],
    japanese: ["in0000224", "in0000027"],
    "south indian": ["in0000236", "in0000235", "in0000240", "in0000241"],
    international: [],
};

export function resolveInterestIdsFromPreferences(preferences = {}) {
    const seen = new Set();
    const interests = [];

    const pushIfPresent = (value) => {
        const id = typeof value === "string" ? value.trim() : "";
        if (!id || seen.has(id)) return;
        seen.add(id);
        interests.push(id);
    };

    const languages = Array.isArray(preferences.languages) ? preferences.languages : [];
    const industries = Array.isArray(preferences.industries)
        ? preferences.industries
        : Array.isArray(preferences.cinemas)
            ? preferences.cinemas
            : [];

    for (const language of languages) {
        pushIfPresent(LANGUAGE_TO_INTEREST_ID[String(language ?? "").trim().toLowerCase()]);
    }

    for (const industry of industries) {
        const mapped = INDUSTRY_TO_INTEREST_IDS[String(industry ?? "").trim().toLowerCase()] ?? [];
        for (const interestId of mapped) {
            pushIfPresent(interestId);
        }
    }

    return interests;
}

export const MOOD_TO_RATING = {
    "mind-bending": 7.5,
    intense: 7.0,
    dark: 7.0,
    emotional: 7.0,
    "feel-good": 6.5,
    romantic: 6.5,
    "fast-paced": 6.5,
    "comfort watch": 6.0,
};

export const MOOD_TO_SORT = {
    "mind-bending": "SORT_BY_RANKING",
    intense: "SORT_BY_RANKING",
    dark: "SORT_BY_RANKING",
    emotional: "SORT_BY_RANKING",
    "feel-good": "SORT_BY_POPULARITY",
    "comfort watch": "SORT_BY_POPULARITY",
    "fast-paced": "SORT_BY_POPULARITY",
    romantic: "SORT_BY_POPULARITY",
};

export const FORMAT_TO_PARAMS = {
    "new releases": { yearOffset: -2, minVoteCount: 500 },
    "classic films": { yearOffset: -50, endYearOffset: -15, minVoteCount: 1000 },
    "franchise movies": { minVoteCount: 1000 },
    "indie films": { minVoteCount: 100, maxVoteCount: 50000 },
    biopics: { minVoteCount: 300 },
};
