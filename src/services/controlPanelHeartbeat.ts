// @ts-nocheck

import { CONTROL_PANEL_MODULES } from '@/config/controlPanelModules';

const HEARTBEAT_KEY = 'control_panel_heartbeat_registry';
const INCIDENT_KEY = 'control_panel_heartbeat_incidents';
const HEARTBEAT_INTERVAL_MS = 15000;
const HEARTBEAT_TIMEOUT_MS = 45000;

let heartbeatTimer: number | null = null;
let monitorTimer: number | null = null;
let activeModulePath = '/control-panel';

const nowIso = () => new Date().toISOString();

const readRegistry = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HEARTBEAT_KEY) || '{}');
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const writeRegistry = (registry: Record<string, string>) => {
  localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(registry));
};

const pushIncident = (payload: Record<string, unknown>) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(INCIDENT_KEY) || '[]');
    const next = [...(Array.isArray(parsed) ? parsed : []), payload].slice(-100);
    localStorage.setItem(INCIDENT_KEY, JSON.stringify(next));
  } catch {
    // Keep heartbeat resilient.
  }
};

const resolveModuleId = (pathname: string) => {
  const match = CONTROL_PANEL_MODULES.find((moduleDef) => pathname === moduleDef.path || pathname.startsWith(`${moduleDef.path}/`));
  if (match) return match.id;
  if (pathname === '/control-panel' || pathname.startsWith('/control-panel/')) return 'control-panel-home';
  return null;
};

const sendHeartbeat = () => {
  const moduleId = resolveModuleId(activeModulePath);
  if (!moduleId) return;

  const registry = readRegistry();
  registry[moduleId] = nowIso();
  writeRegistry(registry);

  window.dispatchEvent(new CustomEvent('sv:control-panel-heartbeat', {
    detail: {
      moduleId,
      pathname: activeModulePath,
      timestamp: registry[moduleId],
    },
  }));
};

const monitorHeartbeats = () => {
  const registry = readRegistry();
  const currentTime = Date.now();

  for (const [moduleId, timestamp] of Object.entries(registry)) {
    const heartbeatTime = Date.parse(String(timestamp));
    if (!Number.isFinite(heartbeatTime)) continue;

    if (currentTime - heartbeatTime > HEARTBEAT_TIMEOUT_MS) {
      const incident = {
        moduleId,
        status: 'missing_heartbeat',
        lastHeartbeat: timestamp,
        detectedAt: nowIso(),
      };
      pushIncident(incident);
      window.dispatchEvent(new CustomEvent('sv:control-panel-heartbeat-missing', { detail: incident }));
      console.error('[CONTROL_PANEL_HEARTBEAT_MISSING]', incident);
    }
  }
};

export const startControlPanelHeartbeat = (pathname: string) => {
  activeModulePath = pathname;

  if (!activeModulePath.startsWith('/control-panel')) {
    return () => {};
  }

  sendHeartbeat();

  if (!heartbeatTimer) {
    heartbeatTimer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  }

  if (!monitorTimer) {
    monitorTimer = window.setInterval(monitorHeartbeats, HEARTBEAT_INTERVAL_MS);
  }

  return () => {
    if (heartbeatTimer) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (monitorTimer) {
      window.clearInterval(monitorTimer);
      monitorTimer = null;
    }
  };
};