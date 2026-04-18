type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export type CentralNotification = {
  id: string;
  source: string;
  event: string;
  level: NotificationLevel;
  target_user_id?: string;
  message: string;
  trace_id?: string;
  created_at: string;
};

const STORE_KEY = 'sv_central_notifications';
const memoryStore: Record<string, string> = {};

const hasWindow = () => typeof window !== 'undefined';
const nowIso = () => new Date().toISOString();

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = hasWindow() ? window.localStorage.getItem(key) : memoryStore[key];
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  if (hasWindow()) {
    window.localStorage.setItem(key, serialized);
    return;
  }
  memoryStore[key] = serialized;
}

export function createCentralNotification(payload: {
  source: string;
  event: string;
  message: string;
  level?: NotificationLevel;
  target_user_id?: string;
  trace_id?: string;
}): CentralNotification {
  const list = readStore<CentralNotification[]>(STORE_KEY, []);
  const item: CentralNotification = {
    id: generateId('ntf'),
    source: payload.source,
    event: payload.event,
    level: payload.level || 'info',
    target_user_id: payload.target_user_id,
    message: payload.message,
    trace_id: payload.trace_id,
    created_at: nowIso(),
  };

  list.push(item);
  writeStore(STORE_KEY, list.slice(-2000));

  if (hasWindow()) {
    window.dispatchEvent(new CustomEvent('sv:central-notification', { detail: item }));
  }

  return item;
}

export function getCentralNotifications(limit = 200): CentralNotification[] {
  return readStore<CentralNotification[]>(STORE_KEY, []).slice(-Math.max(1, limit)).reverse();
}
