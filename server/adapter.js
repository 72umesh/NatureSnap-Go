const MAX_BODY = 6 * 1024 * 1024;

export async function runHandler(handler, req, res) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) {
      res.statusCode = 413;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "That photo is too large. Try a smaller one." }));
    }
  }
  try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }

  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(obj));
    return res;
  };
  await handler(req, res);
}
