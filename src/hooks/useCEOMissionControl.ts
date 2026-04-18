// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const CEO_API = '/api/v1/ceo-dashboard';

async function ceoPost<T>(action: string, payload: Record<string, unknown> = {}): Promise<{ data: T }> {
  const res = await fetch(CEO_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action, payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json?.error || `ceo_api_${action}_failed`);
  return { data: json as T };
}

export interface CEOSummary {
  health_score: number;
  critical_alerts: number;
  ai_actions_today: number;
  open_tasks: number;
  open_deals: number;
  pending_approvals: number;
  revenue_today: number;
}

export interface RevenueSummary {
  order_revenue: number;
  reseller_revenue: number;
  total_revenue: number;
}

export interface CEOAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  type: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  title: string;
  message: string | null;
  approval_required: boolean;
  created_at: string;
  payload: Record<string, unknown>;
}

export interface CEOActionLog {
  id: string;
  action: string;
  status: 'pending' | 'queued' | 'completed' | 'failed' | 'approval_required';
  risk: 'low' | 'medium' | 'high' | 'critical';
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CEOAIAction {
  id: string;
  intent: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approval_required' | 'queued' | 'completed' | 'failed' | 'cancelled';
  approval_required: boolean;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
}

export interface CEOTask {
  task_id: string;
  title: string | null;
  description?: string | null;
  status: string | null;
  priority: string | null;
  due_at?: string | null;
  created_at: string;
}

export interface CEODeal {
  id: string;
  stage: string;
  status: string;
  value: number;
  summary: string | null;
  updated_at: string;
}

export interface CEOHealthMetric {
  id: string;
  service: string | null;
  metric: string;
  status: string | null;
  latency: number | null;
  error_rate: number | null;
  uptime: number | null;
  timestamp: string;
}

interface DashboardPayload {
  summary: CEOSummary;
  revenue_summary: RevenueSummary;
  top_risks: CEOAlert[];
  critical_alerts: CEOAlert[];
  pending_approvals: CEOAIAction[];
  recent_actions: CEOActionLog[];
  active_tasks: CEOTask[];
  active_deals: CEODeal[];
  health: CEOHealthMetric[];
}

interface ListPayload<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function useCEOMissionControl() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [actions, setActions] = useState<CEOActionLog[]>([]);
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [alerts, setAlerts] = useState<CEOAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardResponse, actionsResponse, eventsResponse, alertsResponse] = await Promise.all([
        ceoPost<DashboardPayload>('dashboard'),
        ceoPost<ListPayload<CEOActionLog>>('actions'),
        ceoPost<ListPayload<Record<string, unknown>>>('events'),
        ceoPost<ListPayload<CEOAlert>>('alerts'),
      ]);

      setDashboard(dashboardResponse.data);
      setActions((actionsResponse.data as any)?.items || []);
      setEvents((eventsResponse.data as any)?.items || []);
      setAlerts((alertsResponse.data as any)?.items || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load CEO mission control';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const executeCommand = useCallback(async (text: string, approval = false) => {
    setExecuting(true);
    try {
        const response = await ceoPost<{ status: string; ai_action_id?: string; action_log_id?: string; result?: Record<string, unknown> }>('command', { text, approval });

      if (response.data.status === 'approval_required') {
        toast.warning('Action queued for approval');
      } else {
        toast.success('Command executed');
      }

      await load();
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute CEO command';
      toast.error(message);
      throw error;
    } finally {
      setExecuting(false);
    }
  }, [load]);

  const approveAction = useCallback(async (aiActionId: string) => {
    setApprovingIds((current) => new Set(current).add(aiActionId));
    try {
        await ceoPost<{ status: string }>('approve', { ai_action_id: aiActionId });
      toast.success('Approval executed');
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve CEO action';
      toast.error(message);
      throw error;
    } finally {
      setApprovingIds((current) => {
        const next = new Set(current);
        next.delete(aiActionId);
        return next;
      });
    }
  }, [load]);

  return {
    dashboard,
    actions,
    events,
    alerts,
    loading,
    executing,
    approvingIds,
    reload: load,
    executeCommand,
    approveAction,
  };
}