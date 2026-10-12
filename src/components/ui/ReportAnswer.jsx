import { useState } from "react";
import { reportAnswer } from "../../lib/api.js";

const REASONS = [
  ["wrong_id", "Wrong identification"],
  ["unsafe", "Unsafe suggestion"],
  ["not_outdoors", "Not really outdoors"],
];

export default function ReportAnswer({ result }) {
  const [state, setState] = useState("idle");

  async function send(reason) {
    setState("sending");
    try {
      await reportAnswer(result, reason);
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return <p className="mt-6 text-center text-sm text-moss-700">Thanks, your report was sent.</p>;
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => setState("open")}
        className="mt-6 block w-full text-center text-sm text-moss-700 underline underline-offset-2 hover:text-moss-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss-700"
      >
        Wrong or unsafe? Report this answer
      </button>
    );
  }

  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-moss-700">What was wrong?</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {REASONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            disabled={state === "sending"}
            onClick={() => send(key)}
            className="rounded-full border border-sage-300 bg-white px-3 py-1.5 text-sm text-moss-700 hover:border-moss-700 disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss-700"
          >
            {label}
          </button>
        ))}
      </div>
      {state === "error" && <p className="mt-2 text-sm text-bark-800">Couldn't send that. Try again.</p>}
    </div>
  );
}
