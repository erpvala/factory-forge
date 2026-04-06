import { defineConfig, splitVendorChunkPlugin, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env so we can read VITE_SUPABASE_URL for the dev proxy
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL ?? '';
  const buildStamp = new Date().toISOString().replace(/[-:.TZ]/g, '');

  return {
  server: {
    host: "::",
    port: 8080,
    // HTTP keep-alive for dev server
    headers: {
      "Connection": "keep-alive",
    },
    // ─── Dev proxy: /api/v1/auth/* → Supabase Edge Function ──────────────────
    // This makes the strict spec routes work in development:
    //   POST /api/v1/auth/register → {SUPABASE_URL}/functions/v1/auth-v1/register
    //   POST /api/v1/auth/login    → {SUPABASE_URL}/functions/v1/auth-v1/login
    //   POST /api/v1/auth/logout   → {SUPABASE_URL}/functions/v1/auth-v1/logout
    //   GET  /api/v1/auth/me       → {SUPABASE_URL}/functions/v1/auth-v1/me
    proxy: supabaseUrl ? {
      '/api/v1/auth': {
        target: `${supabaseUrl}/functions/v1/auth-v1`,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/v1\/auth/, ''),
        secure: true,
      },
    } : undefined,
  },

  plugins: [
    react(),
    // Automatically splits vendor chunk from app chunk
    splitVendorChunkPlugin(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Target modern browsers for smaller output
    target: "es2020",
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Inline small assets as base64 (< 4kb)
    assetsInlineLimit: 4096,
    // Source maps off for production (faster builds, smaller files)
    sourcemap: false,
    // Minify with esbuild (fast) — use 'terser' for max compression if needed
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps bundles small & cacheable
        manualChunks(id) {
          // Core React runtime — always cached
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-core";
          }
          // Router
          if (id.includes("node_modules/react-router")) {
            return "router";
          }
          // Radix UI component library
          if (id.includes("node_modules/@radix-ui")) {
            return "radix";
          }
          // Supabase client
          if (id.includes("node_modules/@supabase")) {
            return "supabase";
          }
          // TanStack Query
          if (id.includes("node_modules/@tanstack")) {
            return "tanstack";
          }
          // Framer Motion
          if (id.includes("node_modules/framer-motion")) {
            return "framer";
          }
          // Tailwind CSS / clsx utils
          if (id.includes("node_modules/tailwind") || id.includes("node_modules/clsx") || id.includes("node_modules/class-variance")) {
            return "css-utils";
          }
          // Lucide icons — large bundle, split separately
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }
          // Zustand state management
          if (id.includes("node_modules/zustand")) {
            return "state";
          }
          // Recharts / charting
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) {
            return "charts";
          }
          // All remaining node_modules grouped as vendor
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        // Content-hash filenames for long-term caching
        chunkFileNames: `assets/js/[name]-${buildStamp}-[hash].js`,
        entryFileNames: `assets/js/[name]-${buildStamp}-[hash].js`,
        assetFileNames: `assets/[ext]/[name]-${buildStamp}-[hash].[ext]`,
      },
    },
    // Warn if any single chunk exceeds 1MB
    chunkSizeWarningLimit: 1000,
  },

  // Dependency pre-bundling — pre-bundle heavy deps so first load is instant
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "zustand",
      "framer-motion",
      "lucide-react",
    ],
  },

  // Experimental: enable faster HMR partial reload
  experimental: {},
  };
});
