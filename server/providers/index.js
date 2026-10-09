import { askGemini, geminiModel } from "./gemini.js";
import { askOllama, ollamaModel } from "./ollama.js";

const provider = () => (process.env.LLM_PROVIDER || "gemini").toLowerCase();

export function describeProvider() {
  return provider() === "ollama"
    ? { provider: "ollama", model: ollamaModel() }
    : { provider: "gemini", model: geminiModel() };
}

export function askModel(args) {
  return provider() === "ollama" ? askOllama(args) : askGemini(args);
}
