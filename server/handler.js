import { AppError } from "./errors.js";
import { parseReply } from "./parse.js";
import { MINUTE_CHOICES } from "./prompt.js";
import { askModel, describeProvider } from "./providers/index.js";
import { clientIp, tooManyRequests } from "./rateLimit.js";
import { findRiskyAdvice, SAFE_MISSION } from "./safety.js";
import { Sentry, flushSentry } from "./sentry.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BASE64_CHARS = 4_000_000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const { image, mimeType, note } = req.body ?? {};
  if (typeof image !== "string" || !image) return res.status(400).json({ error: "Please add a photo first." });
  if (!ALLOWED_TYPES.has(mimeType)) return res.status(400).json({ error: "Use a JPG, PNG or WebP photo." });
  if (image.length > MAX_BASE64_CHARS) return res.status(413).json({ error: "That photo is too large. Try a smaller one." });

  if (tooManyRequests(clientIp(req))) {
    return res.status(429).json({
      error: "You're snapping fast! Take a short break and try again in a few minutes.",
    });
  }

  const cleanNote = typeof note === "string" ? note.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  const minutes = MINUTE_CHOICES.includes(Number(req.body?.minutes)) ? Number(req.body.minutes) : null;

  try {
    const result = await Sentry.startSpan(
      {
        name: "POST /api/snap",
        op: "http.server",
        forceTransaction: true,
        attributes: { "http.request.method": "POST", "snap.minutes": minutes ?? 0 },
      },
      async (span) => {
        const raw = await askModel({ imageBase64: image, mimeType, note: cleanNote, minutes });
        const reply = parseReply(raw);

        const risky = findRiskyAdvice(`${reply.look} ${reply.mission}`);
        if (risky.length) {
          reply.mission = SAFE_MISSION;
          reply.look = "Notice its shape, colour and texture from a safe distance.";
          Sentry.captureMessage("Unsafe suggestion replaced", {
            level: "warning",
            tags: { rule: "no_touching", risky_words: risky.slice(0, 3).join(",") },
          });
        }

        const { model } = describeProvider();
        span.setAttributes({
          "snap.title": reply.title,
          "snap.category": reply.category,
          "snap.confidence": reply.confidence,
          "snap.safety_replaced": risky.length > 0,
        });

        const trace = Sentry.getTraceData();
        return {
          ...reply,
          model,
          trace: trace["sentry-trace"] ? { sentryTrace: trace["sentry-trace"], baggage: trace.baggage || "" } : undefined,
        };
      },
    );
    await flushSentry();
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      if (err.status >= 500) Sentry.captureException(err);
      await flushSentry();
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    Sentry.captureException(err);
    await flushSentry();
    return res.status(500).json({ error: "Something went wrong. Try again." });
  }
}
