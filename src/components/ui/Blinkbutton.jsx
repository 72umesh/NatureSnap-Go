export default function BlinkButton({ text }) {
  return (
    <div className="my-3 inline-flex max-w-fit items-center gap-2 rounded-lg bg-sage-100 px-3 py-1">

      <span className="relative flex h-3 w-3 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-moss-700" />
      </span>
      <span className="text-sm font-heading text-moss-700">{text}</span>
    </div>
  );
}
