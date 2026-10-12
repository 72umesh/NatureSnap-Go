import test from "node:test";
import assert from "node:assert/strict";
import { parseReply, parseFollowup, normalizeConfidence } from "../server/parse.js";
import { findRiskyAdvice } from "../server/safety.js";

const clean = `TITLE: Likely Peepal tree
CATEGORY: Tree
CONFIDENCE: Medium
WHAT I SEE: Heart-shaped leaves with long tips.
LOOK CLOSER: Notice the drawn-out leaf tip.
MISSION: Find another tree nearby and compare its leaves.
TIME: ~5 minutes`;

test("parses the exact format including confidence", () => {
  const r = parseReply(clean);
  assert.equal(r.title, "Likely Peepal tree");
  assert.equal(r.confidence, "Medium");
  assert.equal(r.time, "~5 minutes");
});

test("confidence is normalised and defaults to Medium", () => {
  assert.equal(normalizeConfidence("HIGH."), "High");
  assert.equal(normalizeConfidence("low (blurry)"), "Low");
  assert.equal(normalizeConfidence(""), "Medium");
  assert.equal(normalizeConfidence("maybe"), "Medium");
});

test("tolerates markdown and multi-line values", () => {
  const r = parseReply("**TITLE:** Neem\n**What I see:** Serrated\nleaflets.\n**Your Outdoor Mission:** Walk to a park.");
  assert.equal(r.see, "Serrated leaflets.");
  assert.equal(r.mission, "Walk to a park.");
});

test("rejects replies without the required parts", () => {
  assert.throws(() => parseReply("hello there"), { status: 502 });
});

test("parses the follow-up format", () => {
  const r = parseFollowup("WELL DONE: Nice find.\nSPOTTED: Both leaves have lobes.\nNEXT: Try a walk at dusk.");
  assert.equal(r.well, "Nice find.");
  assert.equal(r.next, "Try a walk at dusk.");
  assert.throws(() => parseFollowup("nope"), { status: 502 });
});

test("safety check flags risky advice but not negated or harmless text", () => {
  assert.ok(findRiskyAdvice("Pick up a few leaves and touch the bark.").length > 0);
  assert.ok(findRiskyAdvice("Collect three fallen leaves.").length > 0);
  assert.equal(findRiskyAdvice("Don't touch it. Watch from a safe distance.").length, 0);
  assert.equal(findRiskyAdvice("Look at the feathers without touching them.").length, 0);
  assert.equal(findRiskyAdvice("Find another tree nearby and compare its leaves.").length, 0);
  assert.equal(findRiskyAdvice("Pick a quiet spot and watch the bird for five minutes.").length, 0);
});
