import { AppError } from "../errors.js";
import { SYSTEM_PROMPT, noteText } from "../prompt.js";

const TIMEOUT_MS = 120_000;

export const ollamaModel = () => process.env.OLLAMA_MODEL || "gemma3:4b";
const baseUrl = () => (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/$/, "");

export async function askOllama({ imageBase64, note }) {
  let res;
  try {
    res = await fetch(`${baseUrl()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel(),
        stream: false,
        options: { temperature: 0.6 },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: noteText(note), images: [imageBase64] },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err?.name === "TimeoutError") throw new AppError("The local model took too long.", 504);
    throw new AppError("Can't reach Ollama. Is it running? (ollama serve)", 502);
  }
  if (!res.ok) throw new AppError(`Ollama returned an error. Is "${ollamaModel()}" pulled?`, 502);
  const data = await res.json();
  const text = data?.message?.content?.trim();
  if (!text) throw new AppError("The local model sent back an empty answer.", 502);
  return text;
}