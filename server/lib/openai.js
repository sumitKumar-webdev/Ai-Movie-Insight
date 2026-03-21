const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function summarizeWithOpenAI(movieTitle, input, mode) {
  if (!OPENAI_API_KEY || !input.trim()) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            mode === "reviews"
              ? 'You analyze movie audience reviews. Return strict JSON with keys: summary, sentiment, confidence. sentiment must be "Positive", "Mixed", or "Negative".'
              : "You summarize a movie's available metadata into a concise audience-facing insight. Return strict JSON with keys: summary, confidence.",
        },
        {
          role: "user",
          content:
            mode === "reviews"
              ? `Movie: ${movieTitle}\n\nReviews:\n${input}\n\nRules: summary max 45 words. confidence must be 0..1.`
              : `Movie: ${movieTitle}\n\nMetadata:\n${input}\n\nRules: summary max 45 words. confidence must be 0..1.`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

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
  if (!OPENAI_API_KEY || !Array.isArray(history) || history.length === 0) {
    return null;
  }

  const messages = [
    {
      role: "system",
      content:
        "You are a friendly movie assistant. Return strict JSON with keys: reply, suggestions. reply should directly answer the user about movies in under 120 words. suggestions must be an array with up to 3 movie title strings only.",
    },
    ...history.map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content ?? "").trim(),
    })),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

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
