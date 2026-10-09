import { AppError } from "./errors.js";

const LABELS = {
  "TITLE": "title",
  "CATEGORY": "category",
  "WHAT I SEE": "see",
  "LOOK CLOSER": "look",
  "MISSION": "mission",
  "YOUR OUTDOOR MISSION": "mission",
  "TIME": "time",
};

export function parseReply(raw) {
  const re = /^[\s*#>_-]*(TITLE|CATEGORY|WHAT I SEE|LOOK CLOSER|YOUR OUTDOOR MISSION|MISSION|TIME)[\s*_]*:[\s*_]*/gim;
  const hits = [...raw.matchAll(re)];
  const out = {};

  hits.forEach((m, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].index : raw.length;
    const value = raw
      .slice(m.index + m[0].length, end)
      .replace(/\*\*|__/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const key = LABELS[m[1].toUpperCase()];
    if (value && !out[key]) out[key] = value;
  });

  if (!out.see || !out.mission) {
    throw new AppError("Couldn't read the AI's answer. Please try again.", 502);
  }

  return {
    title: out.title || "Something from nature",
    category: out.category || "Nature",
    see: out.see,
    look: out.look || "Take a slow look at the shape, colour and texture.",
    mission: out.mission,
    time: out.time || "~5 minutes",
  };
}
