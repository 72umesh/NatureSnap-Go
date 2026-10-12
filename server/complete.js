import { AppError } from "./errors.js";
import { parseFollowup } from "./parse.js";
import { askFollowupModel } from "./providers/index.js";
import { clientIp, tooManyRequests } from "./rateLimit.js";
import { findRiskyAdvice } from "./safety.js";
import { Sentry, flushSentry } from "./sentry.js";

const MAX_IMAGE_CHARS = 2_000_000; // two photos must fit under Vercel's 4.5 MB body limit
const clip = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** POST /api/complete  { firstImage, secondImage, mission, title } -> { well, spotted, next } */
export default async function complete(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const { firstImage, secondImage } = req.body ?? {};
  const mission = clip(req.body?.mission, 600);
  const title = clip(req.body?.title, 80);

  if (typeof firstImage !== "string" || typeof secondImage !== "string" || !firstImage || !secondImage) {
    return res.status(400).json({ error: "Please add your new photo first." });
  }
  if (firstImage.length > MAX_IMAGE_CHARS || secondImage.length > MAX_IMAGE_CHARS) {
    return res.status(413).json({ error: "That photo is too large. Try a smaller one." });
  }
  if (!mission) return res.status(400).json({ error: "Missing mission." });

  if (tooManyRequests(`complete:${clientIp(req)}`)) {
    return res.status(429).json({ error: "You're snapping fast! Take a short break and try again." });
  }

  try {
    const result = await Sentry.startSpan(
      { name: "POST /api/complete", op: "http.server", forceTransaction: true, attributes: { "http.request.method": "POST" } },
      async () => {
        const reply = parseFollowup(await askFollowupModel({ firstImage, secondImage, mission, title }));
        if (findRiskyAdvice(reply.next).length) reply.next = "";
        return reply;
      },
    );
    await flushSentry();
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      if (err.status >= 500 && err.status !== 501) Sentry.captureException(err);
      await flushSentry();
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    Sentry.captureException(err);
    await flushSentry();
    return res.status(500).json({ error: "Something went wrong. Try again." });
  }
}
