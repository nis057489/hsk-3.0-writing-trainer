import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/hsk-3.0-writing-trainer/",
  plugins: [react()],
  server: {
    strictPort: true,
    hmr: {
      overlay: false
    }
  }
});
