import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-key";
process.env.RATE_LIMIT_PER_10MIN = "1000";
const { default: snap } = await import("../server/handler.js");
const { default: report } = await import("../server/report.js");
const { default: complete } = await import("../server/complete.js");

const REPLY = "TITLE: Likely Maple leaf\nCATEGORY: Plant\nCONFIDENCE: High\nWHAT I SEE: A lobed leaf.\nLOOK CLOSER: The veins.\nMISSION: Find three leaf shapes.\nTIME: ~10 minutes";
const realFetch = globalThis.fetch;
let lastBody;
const mock = (text, status = 200) => {
  globalThis.fetch = async (_url, init) => {
    lastBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ thought: true, text: "hmm" }, { text }] } }],
        usageMetadata: { promptTokenCount: 300, candidatesTokenCount: 80, totalTokenCount: 380 },
      }),
      { status },
    );
  };
};
const restore = () => (globalThis.fetch = realFetch);

function call(handler, method, body) {
  const res = { setHeader() {}, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  return handler({ method, body, headers: {}, socket: { remoteAddress: "1.2.3.4" } }, res).then(() => res);
}
const photo = { image: "AAAA", mimeType: "image/jpeg" };

test("snap: validation", async () => {
  assert.equal((await call(snap, "GET")).code, 405);
  assert.equal((await call(snap, "POST", {})).code, 400);
  assert.equal((await call(snap, "POST", { image: "AA", mimeType: "application/pdf" })).code, 400);
  assert.equal((await call(snap, "POST", { image: "A".repeat(4_000_001), mimeType: "image/jpeg" })).code, 413);
});

test("snap: returns cards, confidence and model; passes the time to Gemma", async () => {
  mock(REPLY);
  const r = await call(snap, "POST", { ...photo, note: "near park", minutes: 15 });
  restore();
  assert.equal(r.code, 200);
  assert.equal(r.body.confidence, "High");
  assert.equal(r.body.title, "Likely Maple leaf");
  assert.ok(r.body.model);
  const sent = JSON.stringify(lastBody);
  assert.match(sent, /about 15 minutes/);
});

test("snap: ignores unsupported time values", async () => {
  mock(REPLY);
  await call(snap, "POST", { ...photo, minutes: 99 });
  restore();
  assert.doesNotMatch(JSON.stringify(lastBody), /Time the user has/);
});

test("snap: unsafe mission is replaced with a safe one", async () => {
  mock(REPLY.replace("Find three leaf shapes.", "Pick some leaves and taste one."));
  const r = await call(snap, "POST", photo);
  restore();
  assert.equal(r.code, 200);
  assert.match(r.body.mission, /safe distance/);
});

test("snap: Gemma rate limit becomes 429", async () => {
  globalThis.fetch = async () => new Response("{}", { status: 429 });
  const r = await call(snap, "POST", photo);
  restore();
  assert.equal(r.code, 429);
});

test("report: needs a valid reason, then succeeds", async () => {
  assert.equal((await call(report, "POST", { reason: "nope" })).code, 400);
  const ok = await call(report, "POST", { reason: "wrong_id", title: "Maple", confidence: "High", model: "m" });
  assert.equal(ok.code, 200);
  assert.equal(ok.body.ok, true);
});

test("complete: validation and success", async () => {
  assert.equal((await call(complete, "POST", {})).code, 400);
  assert.equal((await call(complete, "POST", { firstImage: "A", secondImage: "B" })).code, 400);
  mock("WELL DONE: Nice.\nSPOTTED: Both have lobes.\nNEXT: Try dusk.");
  const r = await call(complete, "POST", { firstImage: "AAAA", secondImage: "BBBB", mission: "Find leaves", title: "Maple" });
  restore();
  assert.equal(r.code, 200);
  assert.equal(r.body.well, "Nice.");
  assert.equal(lastBody.contents[0].parts.filter((p) => p.inlineData).length, 2);
});
