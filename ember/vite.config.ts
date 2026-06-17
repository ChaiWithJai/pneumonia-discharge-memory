import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Ember runs fully standalone in dev (`npm run dev`). Built assets use a
// relative base so they can be served from any static path (or the pdm server).
export default defineConfig({
  plugins: [svelte()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
  server: { port: 5174 },
});
