import { clientIp, tooManyRequests } from "./rateLimit.js";
import { Sentry, flushSentry } from "./sentry.js";

const REASONS = {
  wrong_id: "Wrong identification",
  unsafe: "Unsafe suggestion",
  not_outdoors: "Mission isn't really outdoors",
  other: "Something else",
};
const clip = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

export default async function report(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const body = req.body ?? {};
  if (!Object.hasOwn(REASONS, body.reason)) return res.status(400).json({ error: "Pick a reason." });
  if (tooManyRequests(`report:${clientIp(req)}`)) {
    return res.status(429).json({ error: "Thanks, we already have your reports. Please wait a bit." });
  }

  const reason = body.reason;
  const answer = {
    title: clip(body.title, 80),
    confidence: clip(body.confidence, 10),
    model: clip(body.model, 60),
  };

  const send = () =>
    Sentry.startSpan(
      { name: "user report", op: "user.feedback", forceTransaction: true, attributes: { "report.reason": reason } },
      () =>
        Sentry.withScope((scope) => {
          scope.setTags({ report_reason: reason, model: answer.model, confidence: answer.confidence });
          scope.setContext("answer", answer);
          Sentry.captureMessage(`User report: ${REASONS[reason]}`, "warning");
        }),
    );

  const sentryTrace = clip(body.trace?.sentryTrace, 200);
  if (sentryTrace) {
    Sentry.continueTrace({ sentryTrace, baggage: clip(body.trace?.baggage, 1000) || undefined }, send);
  } else {
    send();
  }

  await flushSentry();
  return res.status(200).json({ ok: true });
}
