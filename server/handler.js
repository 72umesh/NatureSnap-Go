import { AppError } from "./errors.js";
import { parseReply } from "./parse.js";
import { askModel } from "./providers/index.js";
import { clientIp, tooManyRequests } from "./rateLimit.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BASE64_CHARS = 4_000_000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const { image, mimeType, note } = req.body ?? {};
  if (typeof image !== "string" || !image)
    return res.status(400).json({ error: "Please add a photo first." });
  if (!ALLOWED_TYPES.has(mimeType))
    return res.status(400).json({ error: "Use a JPG, PNG or WebP photo." });
  if (image.length > MAX_BASE64_CHARS)
    return res
      .status(413)
      .json({ error: "That photo is too large. Try a smaller one." });

  if (tooManyRequests(clientIp(req))) {
    return res
      .status(429)
      .json({
        error:
          "You're snapping fast! Take a short break and try again in a few minutes.",
      });
  }

  const cleanNote =
    typeof note === "string"
      ? note.replace(/\s+/g, " ").trim().slice(0, 200)
      : "";

  try {
    const raw = await askModel({
      imageBase64: image,
      mimeType,
      note: cleanNote,
    });
    return res.status(200).json(parseReply(raw));
  } catch (err) {
    if (err instanceof AppError)
      return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Something went wrong. Try again." });
  }
}
