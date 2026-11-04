import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE_PATH lets GitHub Pages serve the app from a sub-path (set in CI),
// while Vercel and local dev default to the site root.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || "/",
});
