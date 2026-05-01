// @ts-nocheck
// Thin wrappers around background edge functions. Never throw to callers —
// background services must degrade silently and never crash the UI.
import { supabase } from '@/integrations/supabase/client';

export interface NotificationItem {
  id: string;
  title: string;
  module: string;
  timestamp: string;
  meta: Record<string, unknown>;
  read: boolean;
}

// ---- Client-side telemetry ----------------------------------------------
export type ServiceName = 'api-notifications' | 'ai-auto-heal';
export interface TelemetryEntry {
  service: ServiceName;
  ok: boolean;
  message?: string;
  at: number;
}

const TELEMETRY_KEY = 'cp.bg.telemetry';
const MAX_ENTRIES = 50;
const listeners = new Set<(entries: TelemetryEntry[]) => void>();

function readTelemetry(): TelemetryEntry[] {
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    return raw ? (JSON.parse(raw) as TelemetryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeTelemetry(entries: TelemetryEntry[]) {
  try {
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => {
    try { fn(entries); } catch { /* ignore */ }
  });
}

function record(service: ServiceName, ok: boolean, message?: string) {
  const entries = readTelemetry();
  entries.push({ service, ok, message, at: Date.now() });
  writeTelemetry(entries);
}

export function getTelemetry(): TelemetryEntry[] {
  return readTelemetry();
}

export function subscribeTelemetry(fn: (entries: TelemetryEntry[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getServiceHealth(service: ServiceName): 'healthy' | 'degraded' | 'unknown' {
  const recent = readTelemetry().filter((e) => e.service === service).slice(-5);
  if (recent.length === 0) return 'unknown';
  const last = recent[recent.length - 1];
  if (!last.ok) return 'degraded';
  return recent.some((e) => !e.ok) ? 'degraded' : 'healthy';
}

// ---- Edge function wrappers ---------------------------------------------
export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const { data, error } = await supabase.functions.invoke('api-notifications', {
      method: 'GET',
    });
    if (error) {
      record('api-notifications', false, error.message);
      return [];
    }
    record('api-notifications', true);
    return (data?.notifications ?? []) as NotificationItem[];
  } catch (err: any) {
    record('api-notifications', false, String(err?.message ?? err));
    return [];
  }
}

export async function pingAutoHeal(issue?: unknown): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('ai-auto-heal', {
      method: 'POST',
      body: issue ?? {},
    });
    if (error) {
      record('ai-auto-heal', false, error.message);
      return false;
    }
    record('ai-auto-heal', true);
    return true;
  } catch (err: any) {
    record('ai-auto-heal', false, String(err?.message ?? err));
    return false;
  }
}

// ---- Notification read state --------------------------------------------
export async function fetchReadIds(userId: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId);
    if (error) return new Set();
    return new Set((data ?? []).map((r: any) => r.notification_id));
  } catch {
    return new Set();
  }
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_reads')
      .insert({ user_id: userId, notification_id: notificationId });
    return !error;
  } catch {
    return false;
  }
}

export async function markAllRead(userId: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  try {
    await supabase
      .from('notification_reads')
      .insert(ids.map((id) => ({ user_id: userId, notification_id: id })));
  } catch {
    /* ignore */
  }
}
