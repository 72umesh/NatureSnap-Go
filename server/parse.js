import { AppError } from "./errors.js";

function parseLabelled(raw, labels) {
  const names = Object.keys(labels).sort((a, b) => b.length - a.length).join("|");
  const re = new RegExp(`^[\\s*#>_-]*(${names})[\\s*_]*:[\\s*_]*`, "gim");
  const hits = [...raw.matchAll(re)];
  const out = {};
  hits.forEach((m, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].index : raw.length;
    const value = raw
      .slice(m.index + m[0].length, end)
      .replace(/\*\*|__/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const key = labels[m[1].toUpperCase()];
    if (value && !out[key]) out[key] = value;
  });
  return out;
}

const SNAP_LABELS = {
  "TITLE": "title",
  "CATEGORY": "category",
  "CONFIDENCE": "confidence",
  "WHAT I SEE": "see",
  "LOOK CLOSER": "look",
  "MISSION": "mission",
  "YOUR OUTDOOR MISSION": "mission",
  "TIME": "time",
};

export function normalizeConfidence(value) {
  const v = String(value || "").toLowerCase();
  if (v.startsWith("high")) return "High";
  if (v.startsWith("low")) return "Low";
  return "Medium";
}

export function parseReply(raw) {
  const out = parseLabelled(raw, SNAP_LABELS);
  if (!out.see || !out.mission) {
    throw new AppError("Couldn't read the AI's answer. Please try again.", 502);
  }
  return {
    title: out.title || "Something from nature",
    category: out.category || "Nature",
    confidence: normalizeConfidence(out.confidence),
    see: out.see,
    look: out.look || "Take a slow look at the shape, colour and texture.",
    mission: out.mission,
    time: out.time || "~5 minutes",
  };
}

const FOLLOWUP_LABELS = { "WELL DONE": "well", "SPOTTED": "spotted", "NEXT": "next" };

export function parseFollowup(raw) {
  const out = parseLabelled(raw, FOLLOWUP_LABELS);
  if (!out.well) throw new AppError("Couldn't read the AI's answer. Please try again.", 502);
  return {
    well: out.well,
    spotted: out.spotted || "Take one more slow look at the details in your photo.",
    next: out.next || "",
  };
}
