const RISKY =
  /\b(touch(?:ing)?|pluck(?:ing)?|taste|tasting|eat(?:ing)?|squeeze|sniff(?:ing)?|handle|handling|collect(?:ing)?|catch(?:ing)?|feed(?:ing)?|pick(?:ing)?\s+(?:up|it|them|some|any|fallen|a\s+(?:leaf|flower|berry|fruit|twig|stone)|the\s+(?:leaf|flower|berry|fruit)|leaves|flowers?|berries))\b/gi;
const NEGATION = /\b(don'?t|do not|never|avoid|without|not|no need to|instead of)\b/i;

export const SAFE_MISSION =
  "Step outside and look for something similar from a safe distance. Notice its shape, colour and texture without touching it.";

export function findRiskyAdvice(text) {
  const found = [];
  for (const m of String(text || "").matchAll(RISKY)) {
    const before = text.slice(Math.max(0, m.index - 30), m.index);
    if (!NEGATION.test(before)) found.push(m[0].toLowerCase());
  }
  return found;
}
