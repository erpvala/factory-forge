import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const ALLOWED_ENTRY_PREFIXES = ['/login', '/control-panel', '/api'];
const BLOCKED_ENTRY_PREFIXES = ['/admin', '/super-admin', '/user', '/dashboard', '/old'];

const shouldRouteGate = (requestUrl: string, acceptHeader: string | undefined): boolean => {
  if (!acceptHeader || !acceptHeader.includes('text/html')) {
    return false;
  }

  const pathname = (requestUrl || '/').split('?')[0];
  if (
    pathname.startsWith('/@vite') ||
    pathname.startsWith('/@fs') ||
    pathname.startsWith('/node_modules') ||
    pathname.startsWith('/src') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/.well-known') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/route_config.json' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return false;
  }

  return true;
};

const isAllowedEntryPath = (pathname: string): boolean => {
  if (BLOCKED_ENTRY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  return ALLOWED_ENTRY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

const routeGateMiddleware = (req: any, res: any, next: any) => {
  const pathname = (req.url || '/').split('?')[0];
  const acceptHeader = req.headers?.accept as string | undefined;

  if (!shouldRouteGate(pathname, acceptHeader)) {
    return next();
  }

  if (!isAllowedEntryPath(pathname)) {
    res.statusCode = 302;
    res.setHeader('Location', '/login');
    res.end();
    return;
  }

  return next();
};

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
    {
      name: 'control-panel-route-gate',
      configureServer(server) {
        server.middlewares.use(routeGateMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(routeGateMiddleware);
      },
    },
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
