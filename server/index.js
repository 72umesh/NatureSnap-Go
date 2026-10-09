import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./handler.js";
import { runHandler } from "./adapter.js";

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const PORT = process.env.PORT || 3000;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json",
};

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname === "/api/snap") {
    return runHandler(handler, req, res).catch((err) => {
      console.error(err);
      res.statusCode = 500;
      res.end();
    });
  }

  let file = path.join(dist, path.normalize(decodeURIComponent(pathname)));
  if (!file.startsWith(dist)) { res.statusCode = 403; return res.end(); }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
  } catch {
    file = path.join(dist, "index.html");
  }
  try {
    const data = await readFile(file);
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("Not found. Run `npm run build` first.");
  }
}).listen(PORT, () => console.log(`NatureSnap running on http://localhost:${PORT}`));
