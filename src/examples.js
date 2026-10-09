const files = import.meta.glob("./assets/examples/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const EXAMPLES = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .slice(0, 4)
  .map(([path, src]) => ({
    src,
    label: path.split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
  }));
