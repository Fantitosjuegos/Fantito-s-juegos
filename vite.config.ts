import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    // Split chunks to reduce initial bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk — React and core libraries
          vendor: ["react", "react-dom", "react-router-dom"],
          // Supabase chunk — loaded separately
          supabase: ["@supabase/supabase-js"],
          // Query chunk
          query: ["@tanstack/react-query"],
          // UI chunk — Radix components
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-label",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
          ],
        },
      },
    },
    // Increase warning limit slightly — we know about the size
    chunkSizeWarningLimit: 600,
    // Optimize images during build
    assetsInlineLimit: 0,
  },
});