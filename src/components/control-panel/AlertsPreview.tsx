// @ts-nocheck
/**
 * ALERTS PREVIEW
 * Mini alert stack showing latest 3 alerts
 * OPTIMIZED: Removed framer-motion, memoized components
 */

import React, { memo, useCallback } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useControlPanelNotifications } from '@/hooks/useControlPanelHub';

interface Alert {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: string;
}

const normalizeAlertType = (source: string): Alert['type'] => {
  if (source.includes('error') || source.includes('security')) return 'error';
  if (source.includes('application') || source.includes('approval')) return 'warning';
  return 'info';
};

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="w-3 h-3 text-red-400" />;
    case 'warning':
      return <AlertTriangle className="w-3 h-3 text-amber-400" />;
    case 'info':
      return <Info className="w-3 h-3 text-blue-400" />;
  }
};

const getAlertBg = (type: Alert['type']) => {
  switch (type) {
    case 'error': return 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15';
    case 'warning': return 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15';
    case 'info': return 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15';
  }
};

const AlertRow = memo<{ alert: Alert }>(({ alert }) => (
  <div
    className={cn(
      "px-2 py-1.5 rounded-md border transition-colors cursor-pointer",
      getAlertBg(alert.type)
    )}
  >
    <div className="flex items-start gap-1.5">
      <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/80 truncate">{alert.message}</p>
        <p className="text-[9px] text-white/50">{alert.timestamp}</p>
      </div>
    </div>
  </div>
));

AlertRow.displayName = 'AlertRow';

export const AlertsPreview: React.FC = memo(() => {
  const navigate = useNavigate();
  const notificationsQuery = useControlPanelNotifications(3, 15000);
  const alerts: Alert[] = (notificationsQuery.data || []).map((notification) => ({
    id: notification.id,
    message: notification.message || notification.title,
    type: normalizeAlertType(notification.source),
    timestamp: formatRelativeTime(notification.createdAt),
  }));

  const handleViewAll = useCallback(() => {
    navigate('/control-panel/notifications');
  }, [navigate]);

  return (
    <div className="space-y-1.5">
      {notificationsQuery.loading && alerts.length === 0 && (
        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-[10px] text-white/60">
          Loading alerts...
        </div>
      )}
      {alerts.map((alert) => (
        <AlertRow key={alert.id} alert={alert} />
      ))}
      {!notificationsQuery.loading && alerts.length === 0 && (
        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-[10px] text-white/60">
          No live alerts right now.
        </div>
      )}
      
      <button
        onClick={handleViewAll}
        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-[10px] text-white/60 hover:text-white/80 active:scale-[0.99]"
      >
        <span>View All Alerts</span>
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
});

AlertsPreview.displayName = 'AlertsPreview';

