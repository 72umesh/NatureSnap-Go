import { AppError } from "../errors.js";
import { SYSTEM_PROMPT, noteText } from "../prompt.js";

const DEFAULT_MODEL = "gemma-4-26b-a4b-it";
const TIMEOUT_MS = 45_000;

export const geminiModel = () => process.env.GEMINI_MODEL || DEFAULT_MODEL;

async function post(apiKey, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel()}:generateContent`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

export async function askGemini({ imageBase64, mimeType, note }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError("Server is missing GEMINI_API_KEY.", 500);

  const userParts = [
    { inlineData: { mimeType, data: imageBase64 } },
    { text: noteText(note) },
  ];
  const generationConfig = { temperature: 0.6, maxOutputTokens: 1024 };
  const withSystem = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: userParts }],
    generationConfig,
  };

  let res;
  try {
    res = await post(apiKey, withSystem);
    if (res.status === 503 || res.status === 500)
      res = await post(apiKey, withSystem);

    if (
      res.status === 400 &&
      /system|developer instruction/i.test(await res.clone().text())
    ) {
      res = await post(apiKey, {
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }, ...userParts] },
        ],
        generationConfig,
      });
    }
  } catch (err) {
    if (err?.name === "TimeoutError")
      throw new AppError("The AI took too long to answer. Try again.", 504);
    throw new AppError(
      "Couldn't reach the AI service. Try again in a moment.",
      502,
    );
  }

  if (!res.ok) {
    if (res.status === 429)
      throw new AppError(
        "Gemma is busy right now. Wait a few seconds and try again.",
        429,
      );
    console.error(
      "Gemini API error",
      res.status,
      await res.text().catch(() => ""),
    );
    throw new AppError(
      "The AI service returned an error. Try again in a moment.",
      502,
    );
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p) => !p.thought && p.text)
    .map((p) => p.text)
    .join("\n")
    .trim();
  if (!text)
    throw new AppError(
      "The AI sent back an empty answer. Try a clearer photo.",
      502,
    );
  return text;
}
