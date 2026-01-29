import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // Dev server (npm run dev) - optional
  server: {
    host: "::",
    port: 8007,
  },

  // Preview server (npm run preview) - THIS is what your systemd service runs
  preview: {
    host: "0.0.0.0",
    port: 8007,
    allowedHosts: ["visitorkiosk.cloud.gravesfoods.com"],
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
