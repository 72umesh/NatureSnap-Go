const OPTIONS = [5, 15, 30];

export default function TimeChips({ value, onChange }) {
  return (
    <div role="group" aria-label="How much time do you have?">
      <span className="text-sm font-medium">How much time do you have? (optional)</span>
      <div className="mt-1.5 flex gap-2">
        {OPTIONS.map((m) => {
          const active = value === m;
          return (
            <button
              key={m}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : m)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss-700 ${
                active
                  ? "border-moss-700 bg-moss-700 text-white"
                  : "border-sage-300 bg-white text-moss-700 hover:border-moss-700"
              }`}
            >
              {m} min
            </button>
          );
        })}
      </div>
    </div>
  );
}
