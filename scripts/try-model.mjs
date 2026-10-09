import { readFile } from "node:fs/promises";
import path from "node:path";
import { askModel, describeProvider } from "../server/providers/index.js";
import { parseReply } from "../server/parse.js";

const [file, note = ""] = process.argv.slice(2);
if (!file) {
  console.error('Give me a photo:  npm run test:api -- photo.jpg "found near my building"');
  process.exit(1);
}

const types = { ".png": "image/png", ".webp": "image/webp" };
const mimeType = types[path.extname(file).toLowerCase()] || "image/jpeg";
const { provider, model } = describeProvider();
console.log(`Provider: ${provider}   Model: ${model}\n`);

try {
  const raw = await askModel({ imageBase64: (await readFile(file)).toString("base64"), mimeType, note });
  console.log("--- RAW ---\n" + raw + "\n");
  console.log("--- PARSED ---");
  console.log(parseReply(raw));
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
}
