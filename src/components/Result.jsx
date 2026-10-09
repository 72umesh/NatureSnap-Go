import BlinkButton from "./ui/Blinkbutton";

const focusRing =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss-700";

export default function Result({ photo, result, onBack, onGo }) {
  return (
    <article>
      <button
        type="button"
        onClick={onBack}
        className={`mb-4 rounded-full py-1 text-sm font-medium text-moss-700 hover:text-moss-900 ${focusRing}`}
      >
        ← New discovery
      </button>

      {photo && (
        <img src={photo.dataUrl} alt="The photo you shared" className="aspect-4/3 w-full rounded-3xl object-cover" />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4 relative">
        <h1 className="font-display text-3xl font-bold leading-tight">{result.title}</h1>
        <BlinkButton text={result.category}/>
      </div>

      <section className="mt-4">
        <h2 className="font-semibold">What I see</h2>
        <p className="mt-1 leading-relaxed text-justify">{result.see}</p>
      </section>

      <section className="mt-5 rounded-xl bg-sage-100 px-4 py-4">
        <h2 className="font-semibold">Look closer</h2>
        <p className="mt-1 leading-relaxed text-justify">{result.look}</p>
      </section>

      <section className="mt-8 rounded-xl bg-moss-900 px-4 py-4 text-sage-50 shadow-lg shadow-moss-900/25">
        <h2 className="font-semibold text-sun-400">Your Outdoor Mission</h2>
        <p className="mt-3 font-display sm:text-2xl text-xl leading-snug text-justify">{result.mission}</p>
        <p className="mt-4 inline-block rounded-full bg-sun-400 px-3 py-1 text-sm font-semibold text-moss-900">
          {result.time}
        </p>
      </section>

      <button
        type="button"
        onClick={onGo}
        className={`mt-8 w-full rounded-full bg-sun-400 px-6 py-3 text-lg font-semibold text-moss-900 transition hover:brightness-95 ${focusRing}`}
      >
        I'm going outside →
      </button>
    </article>
  );
}
