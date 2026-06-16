import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Built assets are served by the Python server (pdm-web) from app/dist, so use
// relative base. In dev, proxy the API + Bonsai routes to the Python server.
export default defineConfig({
  plugins: [svelte()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8765",
      "/illustrate": "http://127.0.0.1:8765",
      "/narrate": "http://127.0.0.1:8765",
    },
  },
});
