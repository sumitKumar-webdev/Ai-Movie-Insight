const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function isGeminiQuotaError(message) {
  const normalized = String(message ?? "").toLowerCase();
  return (
    normalized.includes("quota exceeded") ||
    normalized.includes("rate-limit") ||
    normalized.includes("rate limits") ||
    normalized.includes("generate_content_free_tier_requests")
  );
}

function getGeminiEndpoint() {
  if (!GEMINI_API_KEY) {
    return null;
  }

  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL,
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
}

async function generateGeminiJson({ systemInstruction, conversation, temperature }) {
  const endpoint = getGeminiEndpoint();
  if (!endpoint) {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: conversation.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: String(message.content ?? "").trim() }],
      })),
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error?.message ||
      `Gemini request failed with status ${response.status}`;
    const error = new Error(message);
    if (isGeminiQuotaError(message)) {
      error.code = "GEMINI_QUOTA_EXCEEDED";
    }
    throw error;
  }

  const payload = await response.json();
  const outputText = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => String(part?.text ?? ""))
    .join("")
    .trim();

  if (!outputText) {
    return null;
  }

  try {
    return JSON.parse(outputText);
  } catch {
    return null;
  }
}

export async function summarizeWithOpenAI(movieTitle, input, mode) {
  if (!input.trim()) {
    return null;
  }

  const parsed = await generateGeminiJson({
    temperature: 0.2,
    systemInstruction:
      mode === "reviews"
        ? 'You analyze movie audience reviews. Respond with JSON only using exactly these keys: summary, sentiment, confidence. sentiment must be one of "Positive", "Mixed", or "Negative". Keep summary under 45 words. confidence must be a number between 0 and 1.'
        : "You summarize movie metadata into a concise audience-facing insight. Respond with JSON only using exactly these keys: summary, confidence. Keep summary under 45 words. confidence must be a number between 0 and 1.",
    conversation: [
      {
        role: "user",
        content:
          mode === "reviews"
            ? `Movie: ${movieTitle}\n\nReviews:\n${input}`
            : `Movie: ${movieTitle}\n\nMetadata:\n${input}`,
      },
    ],
  });

  const summary = String(parsed?.summary ?? "").trim();
  if (!summary) {
    return null;
  }

  const confidence = Number(parsed?.confidence ?? 0.5);
  const rawSentiment = String(parsed?.sentiment ?? "");
  const sentiment =
    rawSentiment === "Positive" ||
      rawSentiment === "Mixed" ||
      rawSentiment === "Negative"
      ? rawSentiment
      : undefined;

  return {
    summary,
    confidence,
    sentiment,
  };
}

export async function chatWithMovieAssistant(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return null;
  }

  const parsed = await generateGeminiJson({
    temperature: 0.5,
    systemInstruction: `You are a movie expert who talks like a close friend.

Respond ONLY in valid JSON with exactly these keys:
- reply (string)
- suggestions (array of strings)

STRICT RULES:
1. suggestions must contain only titles that are explicitly recommended or mentioned in reply.
2. If reply mentions 1 title, suggestions must contain exactly that 1 title.
3. If reply mentions 2 or 3 titles, suggestions must contain exactly those same titles in the same order.
4. Never include any title in suggestions that does not appear in reply.
5. Do not replace a title with sequels, trilogy entries, franchise relatives, or similar titles.
6. Example: if reply mentions "The Dark Knight", suggestions must not become "The Dark Knight Rises" unless reply also mentions it.
7. suggestions can have at most 3 items.
8. Use title names only in suggestions, with no years and no commentary.
9. If no title is recommended in reply, return suggestions as [].
10. Keep reply under 70 words, friendly, simple, and natural. Light Hinglish is okay.

VALID EXAMPLE:
{
  "reply": "You should watch The Dark Knight, Sicario, and The Departed. All three have intense crime drama and strong tension.",
  "suggestions": ["The Dark Knight", "Sicario", "The Departed"]
}

INVALID EXAMPLE:
{
  "reply": "You should watch The Dark Knight, Sicario, and The Departed.",
  "suggestions": ["The Dark Knight", "The Dark Knight Rises", "Batman Begins"]
}

Return JSON only.`,
    conversation: history
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: String(message.content ?? "").trim(),
      }))
      .filter((message) => message.content),
  });

  const reply = String(parsed?.reply ?? "").trim();
  const suggestions = Array.isArray(parsed?.suggestions)
    ? parsed.suggestions
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .slice(0, 3)
    : [];

  if (!reply) {
    return null;
  }
  return {
    reply,
    suggestions,
  };
}

export async function getPersonalSuggestionAI({
  searchHistory,
  preferences,
  limit = 8,
}) {
  const parsed = await generateGeminiJson({
    temperature: 0.35,
    systemInstruction: `You create one user's personal weekly movie selection.

Respond ONLY in valid JSON with exactly this key:
- titles (array of strings)

Rules:
1. Return at most ${Math.max(1, limit)} movie or series titles.
2. Stay close to the user's search history and genre/language/mood preferences.
3. Prefer diverse, relevant, strong picks rather than obvious duplicates.
4. Prefer titles that are real and searchable.
5. Use title names only, with no year and no commentary.
6. Return JSON only.`,
    conversation: [
      {
        role: "user",
        content: JSON.stringify({
          searchHistory: Array.isArray(searchHistory) ? searchHistory : [],
          preferences: preferences ?? {},
          limit: Math.max(1, limit),
        }),
      },
    ],
  });

  console.log(parsed)

  return Array.isArray(parsed?.titles)
    ? parsed.titles
      .map((item) => String(item ?? "").trim().toLowerCase())
      .filter(Boolean)
      .slice(0, Math.max(1, limit))
    : [];
}

export const suggestPersonalMovieSelections = getPersonalSuggestionAI;
