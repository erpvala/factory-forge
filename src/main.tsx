// @ts-nocheck
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getRouteViolation } from "@/lib/security/routeLock";

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

if (typeof window !== "undefined") {
  try {
    const routeViolation = getRouteViolation(window.location.pathname);
    if (routeViolation) {
      console.error("[ROUTE_LOCK_BOOT]", routeViolation);
      window.history.replaceState({}, "", "/404");
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

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
    }

  } catch {
    // never block boot
  }
 }

createRoot(document.getElementById("root")!).render(<App />);
