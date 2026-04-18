// @ts-nocheck

import { supabase } from '@/integrations/supabase/client';

const INCIDENT_KEY = 'runtime_auto_protection_incidents';

const pushIncident = (reason: string, payload: Record<string, unknown>) => {
  const detail = {
    reason,
    payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(INCIDENT_KEY) || '[]');
    const next = [...(Array.isArray(parsed) ? parsed : []), detail].slice(-200);
    localStorage.setItem(INCIDENT_KEY, JSON.stringify(next));
  } catch {
    // Keep guard resilient.
  }

  window.dispatchEvent(new CustomEvent('sv:runtime-incident', { detail }));
  console.error('[RUNTIME_PROTECTION]', detail);
};

const installResourceGuard = () => {
  const maxHeapMb = Number(import.meta.env.VITE_MAX_JS_HEAP_MB || 1024);

  const timer = window.setInterval(() => {
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
    const usedMb = perf.memory ? Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)) : 0;

    if (usedMb > 0 && usedMb >= maxHeapMb) {
      pushIncident('high_heap_usage', { usedMb, maxHeapMb });
    }
  }, 15000);

  return () => window.clearInterval(timer);
};

const installSessionAnomalyGuard = () => {
  const events: number[] = [];
  const maxEventsPerMinute = Number(import.meta.env.VITE_MAX_SESSION_EVENTS_PER_MIN || 240);

  const onSignal = () => {
    const now = Date.now();
    events.push(now);
    while (events.length > 0 && now - events[0] > 60000) {
      events.shift();
    }

    if (events.length > maxEventsPerMinute) {
      pushIncident('session_anomaly_detected', { eventsPerMinute: events.length, limit: maxEventsPerMinute });
      void supabase.auth.signOut();
      window.location.replace('/login');
    }
  };

  window.addEventListener('click', onSignal, true);
  window.addEventListener('keydown', onSignal, true);
  window.addEventListener('popstate', onSignal, true);

  return () => {
    window.removeEventListener('click', onSignal, true);
    window.removeEventListener('keydown', onSignal, true);
    window.removeEventListener('popstate', onSignal, true);
  };
};

const installLocalLogPruner = () => {
  const logKeys = [
    'route_lock_incidents',
    'route_lock_blacklist',
    'control_panel_heartbeat_incidents',
    'button_action_guard_incidents',
    'system_sync_guard_incidents',
    INCIDENT_KEY,
  ];

  const timer = window.setInterval(() => {
    for (const key of logKeys) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(parsed) && parsed.length > 250) {
          localStorage.setItem(key, JSON.stringify(parsed.slice(-250)));
        }
      } catch {
        // Keep pruner resilient.
      }
    }
  }, 60000);

  return () => window.clearInterval(timer);
};

export const installRuntimeAutoProtection = () => {
  if (typeof window === 'undefined') return () => {};

  const cleanups = [
    installResourceGuard(),
    installSessionAnomalyGuard(),
    installLocalLogPruner(),
  ];

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
};
