import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { runHandler } from "./server/adapter.js";

function apiDev() {
  return {
    name: "api-dev",
    configureServer(server) {
      server.middlewares.use("/api/snap", async (req, res) => {
        try {
          const { default: handler } =
            await server.ssrLoadModule("/server/handler.js");
          await runHandler(handler, req, res);
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({ error: "Something went wrong. Try again." }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env))
    if (process.env[k] === undefined) process.env[k] = v;
  return { plugins: [react(), tailwindcss(), apiDev()] };
});
