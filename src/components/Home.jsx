import { useRef, useState } from "react";
import { EXAMPLES } from "../examples.js";

const focusRing =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss-700";

export default function Home({
  photo,
  note,
  setNote,
  error,
  onFile,
  onSubmit,
}) {
  const inputRef = useRef(null);
  const [broken, setBroken] = useState(() => new Set());
  const examples = EXAMPLES.filter((ex) => !broken.has(ex.src));

  async function pickExample(ex) {
    try {
      const blob = await (await fetch(ex.src)).blob();
      onFile(new File([blob], ex.label, { type: blob.type || "image/jpeg" }));
    } catch {
      
    }
  }

  return (
    <div className="space-y-8">
      <header className="text-center space-y-3 mb-4">
        <div aria-hidden className="text-4xl">
          🌿
        </div>
        <h1 className=" font-display sm:text-4xl text-3xl font-bold tracking-tight">
          NatureSnap + Go
        </h1>
        <p className=" text-lg text-moss-700">
          See something interesting outside?
        </p>
        <p className="text-moss-700">
          Snap it. Learn about it. Then go explore.
        </p>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex aspect-4/3 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-moss-500/60 bg-sage-100 text-moss-700 transition hover:border-moss-700 ${focusRing}`}
      >
        {photo ? (
          <>
            <img
              src={photo.dataUrl}
              alt="Your photo"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-3 rounded-full bg-moss-900/85 px-4 py-1.5 text-sm font-medium text-sage-50">
              Change photo
            </span>
          </>
        ) : (
          <>
            <span aria-hidden className="text-5xl">
              📸
            </span>
            <span className="mt-3 text-lg font-semibold">Upload a photo</span>
            <span className="text-sm mt-2">
              Take one now or pick from your gallery
            </span>
          </>
        )}
      </button>

      <label className="block">
        <span className="text-sm font-medium">
          Any extra details? (optional)
        </span>
        <input
          type="text"
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Found near my society, in a park…"
          className={`mt-2 w-full rounded-lg border border-sage-300 bg-white px-4 py-3 placeholder:text-moss-700/50 ${focusRing}`}
        />
      </label>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-bark-800 px-4 py-3 text-sm text-sage-50"
        >
          {error}
        </p>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!photo}
          className={`w-full rounded-full bg-moss-700 px-8 py-2 text-lg font-semibold text-white transition hover:bg-moss-900 disabled:cursor-not-allowed disabled:bg-sage-300 disabled:text-moss-700 ${focusRing}`}
        >
          Snap &amp; Go
        </button>

        <p className="text-center text-sm text-moss-700">
          Plants · Birds · Trees · Insects · Flowers
        </p>
      </div>
      {examples.length > 0 && (
        <section className=" space-y-4" aria-label="Example photos">
          <h2 className="text-sm font-medium">
            No photo handy? Try one of these.
          </h2>
          <ul className="mt-2 grid grid-cols-4 gap-2">
            {examples.map((ex) => (
              <li key={ex.src}>
                <button
                  type="button"
                  onClick={() => pickExample(ex)}
                  className={`block w-full overflow-hidden rounded-2xl ${focusRing}`}
                >
                  <img
                    src={ex.src}
                    alt={ex.label}
                    className="aspect-square w-full object-cover"
                    onError={() => setBroken((s) => new Set(s).add(ex.src))}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
