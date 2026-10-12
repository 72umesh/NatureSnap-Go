const LEVELS = {
  High: { dot: "bg-moss-500", hint: "Clear in the photo" },
  Medium: { dot: "bg-sun-400", hint: "A good guess" },
  Low: { dot: "bg-bark-800", hint: "Not sure, treat as a hint" },
};

export default function Confidence({ level = "Medium" }) {
  const { dot, hint } = LEVELS[level] ?? LEVELS.Medium;
  return (
    <p className="inline-flex items-center gap-2 rounded-lg bg-sage-100 px-3 py-1 text-sm text-moss-700">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className="font-medium">{level} confidence</span>
      <span className="text-moss-700/70">· {hint}</span>
    </p>
  );
}
