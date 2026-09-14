import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://bill-mccoy.github.io",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});