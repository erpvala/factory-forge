// Service Worker Unregistration - Runs at app boot
// This script removes all cached service workers that may be serving stale UI

(function unregisterAllServiceWorkers() {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().then(() => {
          console.log('✓ Service Worker unregistered:', registration.scope);
        }).catch((err) => {
          console.error('✗ Failed to unregister SW:', err);
        });
      });
    }).catch((err) => {
      console.error('✗ Failed to get SW registrations:', err);
    });
  }

  // Also clear the service worker cache storage
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName).then(() => {
          console.log('✓ Cache cleared:', cacheName);
        }).catch((err) => {
          console.error('✗ Failed to clear cache:', cacheName, err);
        });
      });
    }).catch((err) => {
      console.error('✗ Failed to get cache names:', err);
    });
  }

  // Clear browser cache manifests
  if ('indexedDB' in window) {
    try {
      indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => {
          if (db.name.includes('cache') || db.name.includes('sw')) {
            indexedDB.deleteDatabase(db.name);
            console.log('✓ IndexedDB cleared:', db.name);
          }
        });
      }).catch((err) => {
        console.error('✗ Failed to clear IndexedDB:', err);
      });
    } catch (e) {
      // IndexedDB may not be available
    }
  }

  console.log('🔄 Service Worker cleanup initiated - all stale caches will be purged');
})();
