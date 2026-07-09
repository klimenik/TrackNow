import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// When building for GitHub Pages the app is served from /TrackNow/.
// In dev it stays at /.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/TrackNow/" : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "TrackNow",
        short_name: "TrackNow",
        description: "Track your work time – local, offline, no account.",
        lang: "en",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
}));
