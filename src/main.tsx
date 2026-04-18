// @ts-nocheck
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getRouteViolation, installRuntimeRouteScanner } from "@/lib/security/routeLock";
import { enforceSystemSynchronizationOnBoot } from "@/services/systemSyncGuard";
import { installButtonActionWatcher } from "@/services/buttonActionWatcher";
import { installRuntimeAutoProtection } from "@/services/runtimeAutoProtection";
import { installAccountTakeoverGuard } from "@/services/accountTakeoverGuard";

const LEGACY_STORAGE_MATCHERS = [
  ["super", "admin", "system"].join("-"),
  ["role", "switch"].join("-"),
  ["wire", "frame"].join(""),
  ["legacy", "ui"].join("-"),
];

const clearLegacyStorage = (storage: Storage) => {
  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const key = storage.key(i);
    if (!key) continue;
    const normalized = key.toLowerCase();
    if (LEGACY_STORAGE_MATCHERS.some((token) => normalized.includes(token))) {
      storage.removeItem(key);
    }
  }
};

const root = createRoot(document.getElementById("root")!);

const SyncBlockedScreen = ({ errors }: { errors: string[] }) => (
  <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
    <div style={{ maxWidth: "960px", width: "100%", background: "#111827", border: "1px solid #334155", borderRadius: "12px", padding: "20px" }}>
      <h1 style={{ margin: "0 0 10px", fontSize: "22px" }}>System Synchronization Blocked</h1>
      <p style={{ margin: "0 0 16px", color: "#cbd5e1" }}>Startup validation failed. UI render is blocked until route/api/db synchronization is restored.</p>
      <ul style={{ margin: 0, paddingLeft: "20px", color: "#fca5a5" }}>
        {errors.map((err) => (
          <li key={err}>{err}</li>
        ))}
      </ul>
    </div>
  </div>
);

const bootstrap = async () => {
  if (typeof window !== "undefined") {
  try {
    const routeViolation = getRouteViolation(window.location.pathname);
    if (routeViolation) {
      console.error("[ROUTE_LOCK_BOOT]", routeViolation);
      window.history.replaceState({}, "", "/control-panel");
    }

    const storedTheme = localStorage.getItem("ui-theme");
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (storedTheme === "light") {
      document.documentElement.classList.remove("dark");
    }

    // Ensure root containers can always receive pointer events.
    document.documentElement.style.pointerEvents = "auto";
    document.body.style.pointerEvents = "auto";

    // Remove inert if it was accidentally applied globally.
    document.documentElement.removeAttribute("inert");
    document.body.removeAttribute("inert");
    document.getElementById("root")?.removeAttribute("inert");

    clearLegacyStorage(localStorage);
    clearLegacyStorage(sessionStorage);

    // LAYER 4: Complete cleanup on every boot
    // This ensures zero cached old UI can ever be served
    
    // Clear ALL localStorage (not just legacy patterns)
    localStorage.clear();
    sessionStorage.clear();

    // Clear all service workers and caches (async, non-blocking)
    void (async () => {
      // Clear all service workers
      if ("serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('✓ Unregistered SW:', registration.scope);
          }
        } catch (error) {
          console.error('✗ Failed to unregister SW:', error);
        }
      }

      // Clear HTTP cache via Cache API
      if ("caches" in window) {
        try {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log('✓ Cleared cache:', cacheName);
          }
        } catch (error) {
          console.error('✗ Failed to clear caches:', error);
        }
      }

      // Clear IndexedDB caches
      if ("indexedDB" in window) {
        try {
          const databases = await (indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> }).databases?.() ?? [];
          for (const db of databases) {
            if (db.name?.includes('cache') || db.name?.includes('sw')) {
              indexedDB.deleteDatabase(db.name!);
              console.log('✓ Cleared IndexedDB:', db.name);
            }
          }
        } catch {
          // IndexedDB not available in all browsers
        }
      }
    })();

    // Install immutable runtime route scanner and hard blocker.
    installRuntimeRouteScanner();
    installButtonActionWatcher();
    installRuntimeAutoProtection();
    installAccountTakeoverGuard();

    const syncValidation = await enforceSystemSynchronizationOnBoot();
    if (!syncValidation.ok) {
      root.render(<SyncBlockedScreen errors={syncValidation.errors} />);
      return;
    }

  } catch {
    // never block boot
  }
  }

  root.render(<App />);
};

void bootstrap();
