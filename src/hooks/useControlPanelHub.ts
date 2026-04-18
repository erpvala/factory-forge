import { useCallback, useEffect, useMemo, useState } from 'react';

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export interface ControlPanelOverview {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  systemHealth: number;
  activeModules: number;
  pendingApplications: number;
  unreadNotifications: number;
  moduleStatuses: Array<{ moduleId: string; actions: number }>;
  recentEvents: Array<{
    id: string;
    title: string;
    message: string;
    status: 'success' | 'pending' | 'info';
    createdAt: string;
  }>;
}

export interface ControlPanelNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  source: string;
}

export interface ControlPanelApplication {
  id: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || payload?.message || `request_failed:${response.status}`);
  }

  return payload as T;
}

function usePollingResource<T>(fetcher: () => Promise<T>, intervalMs: number) {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error instanceof Error ? error.message : 'unknown_error' });
    }
  }, [fetcher]);

  useEffect(() => {
    void refresh();
    if (intervalMs <= 0) return undefined;
    const interval = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs, refresh]);

  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}

export function useControlPanelOverview(intervalMs = 30000) {
  return usePollingResource(async () => {
    const payload = await requestJson<{ success: true; overview: ControlPanelOverview }>('/api/dashboard/overview');
    return payload.overview;
  }, intervalMs);
}

export function useControlPanelNotifications(limit = 8, intervalMs = 15000) {
  return usePollingResource(async () => {
    const payload = await requestJson<{ success: true; notifications: any[] }>(`/api/notifications?limit=${limit}`);
    return payload.notifications.map((notification) => ({
      id: String(notification._id || notification.id),
      title: String(notification.data?.title || 'Notification'),
      message: String(notification.data?.message || ''),
      createdAt: String(notification.timestamp || notification.createdAt || new Date().toISOString()),
      source: String(notification.source || 'notifications'),
    })) as ControlPanelNotification[];
  }, intervalMs);
}

export function useControlPanelApplications(limit = 8, intervalMs = 20000) {
  return usePollingResource(async () => {
    const payload = await requestJson<{ success: true; applications: any[] }>(`/api/applications?status=PENDING&limit=${limit}`);
    return payload.applications.map((application) => ({
      id: String(application.id),
      userId: String(application.userId || ''),
      role: String(application.role || 'user'),
      status: String(application.status || 'PENDING'),
      createdAt: String(application.createdAt || new Date().toISOString()),
    })) as ControlPanelApplication[];
  }, intervalMs);
}

export async function runControlPanelAction(action: string, payload?: Record<string, unknown>) {
  return requestJson<{ success: true; action: string; status: string; notificationId?: string }>('/api/control-panel/actions', {
    method: 'POST',
    body: JSON.stringify({ action, payload: payload || {} }),
  });
}

export async function approveControlPanelApplication(applicationId: string) {
  return requestJson<{ success: true; message: string }>(`/api/applications/${applicationId}/approve`, {
    method: 'POST',
    headers: {
      'x-confirm-action': 'true',
      'x-2fa-verified': 'true',
    },
  });
}

export async function rejectControlPanelApplication(applicationId: string) {
  return requestJson<{ success: true; message: string }>(`/api/applications/${applicationId}/reject`, {
    method: 'POST',
    headers: {
      'x-confirm-action': 'true',
      'x-2fa-verified': 'true',
    },
  });
}
