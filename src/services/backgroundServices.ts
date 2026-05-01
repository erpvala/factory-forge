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

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const { data, error } = await supabase.functions.invoke('api-notifications', {
      method: 'GET',
    });
    if (error) return [];
    return (data?.notifications ?? []) as NotificationItem[];
  } catch {
    return [];
  }
}

export async function pingAutoHeal(issue?: unknown): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('ai-auto-heal', {
      method: 'POST',
      body: issue ?? {},
    });
    return !error;
  } catch {
    return false;
  }
}
