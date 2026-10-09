import { useEffect, useState } from "react";

const LINES = ["Looking closely…", "Comparing the details…", "Finding your mission…"];

export default function Loading({ photo }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center" role="status" aria-live="polite">
      {photo && (
        <img
          src={photo.dataUrl}
          alt=""
          className="aspect-4/3 w-full animate-pulse rounded-3xl object-cover motion-reduce:animate-none"
        />
      )}
      <p className="mt-6 font-display text-2xl">{LINES[i]}</p>
    </div>
  );
}
