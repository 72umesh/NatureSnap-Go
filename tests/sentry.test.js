import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-key";
process.env.RATE_LIMIT_PER_10MIN = "1000";
const { initSentry, Sentry } = await import("../server/sentry.js");

const items = [];
initSentry({
  dsn: "https://key@o0.ingest.sentry.io/1",
  tracesSampleRate: 1,
  transport: () => ({
    send: async (envelope) => {
      for (const [header, payload] of envelope[1]) items.push({ type: header.type, payload });
      return {};
    },
    flush: async () => true,
  }),
});

const { default: snap } = await import("../server/handler.js");
const { default: report } = await import("../server/report.js");

const REPLY = "TITLE: Maple\nCATEGORY: Tree\nCONFIDENCE: High\nWHAT I SEE: A leaf.\nLOOK CLOSER: Veins.\nMISSION: Compare leaves.\nTIME: ~5 minutes";
function call(handler, body) {
  const res = { setHeader() {}, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  return handler({ method: "POST", body, headers: {}, socket: { remoteAddress: "9.9.9.9" } }, res).then(() => res);
}

test("Gemma call is traced with model and token usage, and a report joins the same trace", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: REPLY }] } }],
      usageMetadata: { promptTokenCount: 321, candidatesTokenCount: 45, totalTokenCount: 366 },
    }), { status: 200 });

  const r = await call(snap, { image: "AAAA", mimeType: "image/jpeg" });
  assert.equal(r.code, 200);
  assert.ok(r.body.trace?.sentryTrace, "response carries trace info");
  const traceId = r.body.trace.sentryTrace.split("-")[0];

  const rep = await call(report, { reason: "wrong_id", title: "Maple", confidence: "High", model: "m", trace: r.body.trace });
  assert.equal(rep.code, 200);
  await Sentry.flush(2000);

  const spans = items.filter((i) => i.type === "span").flatMap((i) => i.payload.items);
  const attr = (span, key) => span.attributes?.[key]?.value;

  const gen = spans.find((sp) => attr(sp, "sentry.op") === "gen_ai.chat");
  assert.ok(gen, "gen_ai span exists");
  assert.equal(attr(gen, "gen_ai.usage.input_tokens"), 321);
  assert.equal(attr(gen, "gen_ai.usage.output_tokens"), 45);
  assert.equal(attr(gen, "gen_ai.request.model"), "gemma-4-26b-a4b-it");
  assert.equal(gen.trace_id, traceId);

  const snapSpan = spans.find((sp) => sp.name === "POST /api/snap");
  assert.ok(snapSpan, "snap segment sent");
  assert.equal(attr(snapSpan, "snap.confidence"), "High");

  const repSpan = spans.find((sp) => sp.name === "user report");
  assert.ok(repSpan, "report span sent");
  assert.equal(repSpan.trace_id, traceId, "report is in the same trace as the answer");
  assert.equal(repSpan.parent_span_id, r.body.trace.sentryTrace.split("-")[1], "report hangs under the answer's span");

  const msg = items.find((i) => i.type === "event" && /User report/.test(i.payload.message || ""));
  assert.ok(msg, "report event sent");
  assert.equal(msg.payload.tags.report_reason, "wrong_id");
});
