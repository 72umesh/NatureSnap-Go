export default function Going({ onDone }) {
  return (
    <div className="text-center space-y-4">
      <div aria-hidden className="text-4xl">🌿</div>
      <h1 className="font-display text-4xl font-bold">Mission ready</h1>
      <p className="text-lg text-moss-700">You have everything you need.</p>
      <p className="text-lg text-moss-700">Now put your phone away and go explore.</p>
      <button
        type="button"
        onClick={onDone}
        className="rounded-full bg-moss-700 px-12 py-2 text-lg font-semibold text-white transition hover:bg-moss-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss-700"
      >
        Done ✓
      </button>
    </div>
  );
}
