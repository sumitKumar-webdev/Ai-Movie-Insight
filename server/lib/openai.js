const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
    throw new Error(message);
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
    temperature: 0.7,
    systemInstruction:
      "You are a warm, natural movie assistant. Respond with JSON only using exactly these keys: reply and suggestions. reply should feel human, conversational, and helpful while directly answering the user about movies in under 100 words. suggestions must be an array of movie title strings with at most 3 items. Return 1 or 2 suggestions when that is enough, and only return 3 when it genuinely helps.",
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
