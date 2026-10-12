import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { runHandler } from "./server/adapter.js";

const API_ROUTES = [
  ["/api/snap", "/server/handler.js"],
  ["/api/report", "/server/report.js"],
  ["/api/complete", "/server/complete.js"],
];

function apiDev() {
  return {
    name: "api-dev",
    configureServer(server) {
      for (const [route, file] of API_ROUTES) {
        server.middlewares.use(route, async (req, res) => {
          try {
            const { default: handler } = await server.ssrLoadModule(file);
            await runHandler(handler, req, res);
          } catch (err) {
            console.error(err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Something went wrong. Try again." }));
          }
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env))
    if (process.env[k] === undefined) process.env[k] = v;
  return { plugins: [react(), tailwindcss(), apiDev()] };
});
