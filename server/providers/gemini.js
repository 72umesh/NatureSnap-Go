import { AppError } from "../errors.js";
import { SYSTEM_PROMPT, FOLLOWUP_PROMPT, noteText } from "../prompt.js";
import { Sentry } from "../sentry.js";

const DEFAULT_MODEL = "gemma-4-26b-a4b-it";
const TIMEOUT_MS = 45_000;
const GENERATION = { temperature: 0.6, maxOutputTokens: 1024 };

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

async function generate({ system, parts }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError("Server is missing GEMINI_API_KEY.", 500);
  const model = geminiModel();

  return Sentry.startSpan(
    {
      name: `chat ${model}`,
      op: "gen_ai.chat",
      attributes: {
        "gen_ai.operation.name": "chat",
        "gen_ai.system": "gcp.gemini",
        "gen_ai.request.model": model,
        "gen_ai.request.temperature": GENERATION.temperature,
        "gen_ai.request.max_tokens": GENERATION.maxOutputTokens,
      },
    },
    async (span) => {
      const withSystem = {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: GENERATION,
      };

      let res;
      let retries = 0;
      try {
        res = await post(apiKey, withSystem);
        if (res.status === 503 || res.status === 500) {
          retries++;
          res = await post(apiKey, withSystem);
        }
        if (res.status === 400 && /system|developer instruction/i.test(await res.clone().text())) {
          res = await post(apiKey, {
            contents: [{ role: "user", parts: [{ text: system }, ...parts] }],
            generationConfig: GENERATION,
          });
        }
      } catch (err) {
        if (err?.name === "TimeoutError") throw new AppError("The AI took too long to answer. Try again.", 504);
        throw new AppError("Couldn't reach the AI service. Try again in a moment.", 502);
      }
      span.setAttribute("snap.retries", retries);
      span.setAttribute("http.response.status_code", res.status);

      if (!res.ok) {
        if (res.status === 429) throw new AppError("Gemma is busy right now. Wait a few seconds and try again.", 429);
        console.error("Gemini API error", res.status, await res.text().catch(() => ""));
        throw new AppError("The AI service returned an error. Try again in a moment.", 502);
      }

      const data = await res.json();

      const usage = data?.usageMetadata;
      if (usage) {
        const input = usage.promptTokenCount ?? 0;
        const output = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
        span.setAttributes({
          "gen_ai.usage.input_tokens": input,
          "gen_ai.usage.output_tokens": output,
          "gen_ai.usage.total_tokens": usage.totalTokenCount ?? input + output,
        });
        const pIn = Number(process.env.PRICE_INPUT_PER_M);
        const pOut = Number(process.env.PRICE_OUTPUT_PER_M);
        if (pIn >= 0 && pOut >= 0 && (pIn || pOut)) {
          span.setAttribute("snap.estimated_cost_usd", (input * pIn + output * pOut) / 1_000_000);
        }
      }

      const out = data?.candidates?.[0]?.content?.parts ?? [];
      const text = out.filter((p) => !p.thought && p.text).map((p) => p.text).join("\n").trim();
      if (!text) throw new AppError("The AI sent back an empty answer. Try a clearer photo.", 502);
      return text;
    },
  );
}

export function askGemini({ imageBase64, mimeType, note, minutes }) {
  return generate({
    system: SYSTEM_PROMPT,
    parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: noteText(note, minutes) }],
  });
}

export function askGeminiFollowup({ firstImage, secondImage, mission, title }) {
  return generate({
    system: FOLLOWUP_PROMPT,
    parts: [
      { text: "FIRST PHOTO (before the mission):" },
      { inlineData: { mimeType: "image/jpeg", data: firstImage } },
      { text: `MISSION given (context only): "${mission}"${title ? ` (first photo: ${title})` : ""}` },
      { text: "SECOND PHOTO (what the user found outside):" },
      { inlineData: { mimeType: "image/jpeg", data: secondImage } },
    ],
  });
}
