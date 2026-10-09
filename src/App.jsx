import { useState } from "react";
import Home from "./components/Home.jsx";
import Loading from "./components/Loading.jsx";
import Result from "./components/Result.jsx";
import Going from "./components/Going.jsx";
import { toJpeg } from "./lib/image.js";
import { snapPhoto } from "./lib/api.js";

export default function App() {
  const [stage, setStage] = useState("home"); 

  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function reset() {
    setStage("home");
    setPhoto(null);
    setNote("");
    setResult(null);
    setError("");
    window.scrollTo(0, 0);
  }

  async function loadFile(file, presetNote = "") {
    setError("");
    try {
      setPhoto(await toJpeg(file));
      if (presetNote) setNote(presetNote);
    } catch (e) {
      setError(e.message);
    }
  }

  async function snapAndGo() {
    if (!photo) return;
    setError("");
    setStage("loading");
    try {
      setResult(await snapPhoto(photo, note));
      setStage("result");
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e.message);
      setStage("home");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-8">
      {stage === "home" && (
        <Home photo={photo} note={note} setNote={setNote} error={error} onFile={loadFile} onSubmit={snapAndGo} />
      )}
      {stage === "loading" && <Loading photo={photo} />}
      {stage === "result" && result && (
        <Result photo={photo} result={result} onBack={reset} onGo={() => setStage("going")} />
      )}
      {stage === "going" && <Going onDone={reset} />}

      <p className="mt-auto pt-10 text-center text-xs leading-relaxed text-moss-700/80">
        AI identification is a best guess, not expert identification. Observe unfamiliar nature safely and don't touch or consume it.
      </p>
    </main>
  );
}
