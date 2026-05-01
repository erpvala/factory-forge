// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Wifi, WifiOff, Bell, Settings, LogOut, Activity, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  fetchNotifications,
  pingAutoHeal,
  NotificationItem,
  getServiceHealth,
  subscribeTelemetry,
  fetchReadIds,
  markNotificationRead,
  markAllRead,
} from '@/services/backgroundServices';

interface ControlPanelHeaderProps {
  streamingOn: boolean;
  onStreamingToggle: () => void;
}

export function ControlPanelHeader({ streamingOn, onStreamingToggle }: ControlPanelHeaderProps) {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [healStatus, setHealStatus] = useState<'healthy' | 'degraded' | 'unknown'>('unknown');
  const [notifStatus, setNotifStatus] = useState<'healthy' | 'degraded' | 'unknown'>('unknown');
  const [retrying, setRetrying] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const refreshHealth = () => {
    setHealStatus(getServiceHealth('ai-auto-heal'));
    setNotifStatus(getServiceHealth('api-notifications'));
  };

  const loadAll = async () => {
    const items = await fetchNotifications();
    setNotifications(items);
    if (user?.id) {
      const ids = await fetchReadIds(user.id);
      setReadIds(ids);
    }
    refreshHealth();
  };

  useEffect(() => {
    loadAll();
    pingAutoHeal().then(refreshHealth);
    const notifTimer = setInterval(loadAll, 60_000);
    const healTimer = setInterval(() => pingAutoHeal().then(refreshHealth), 120_000);
    const unsub = subscribeTelemetry(refreshHealth);
    return () => {
      clearInterval(notifTimer);
      clearInterval(healTimer);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (open && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const handleRetry = async () => {
    setRetrying(true);
    await Promise.all([loadAll(), pingAutoHeal().then(refreshHealth)]);
    setRetrying(false);
    toast.success('Background services retried');
  };

  const handleMarkRead = async (id: string) => {
    if (!user?.id || readIds.has(id)) return;
    setReadIds((prev) => new Set(prev).add(id));
    await markNotificationRead(user.id, id);
  };

  const handleMarkAll = async () => {
    if (!user?.id) return;
    const unread = notifications.filter((n) => !readIds.has(n.id)).map((n) => n.id);
    if (!unread.length) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      unread.forEach((id) => next.add(id));
      return next;
    });
    await markAllRead(user.id, unread);
  };

  const degraded = healStatus === 'degraded' || notifStatus === 'degraded';
  const statusColor = degraded ? '#f59e0b' : healStatus === 'healthy' ? '#10b981' : '#64748b';
  const statusLabel = degraded ? 'DEGRADED' : healStatus === 'healthy' ? 'HEALTHY' : 'IDLE';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16"
      style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-400" />
        <span className="text-white font-bold text-lg tracking-wide">CONTROL PANEL</span>
        <span className="text-xs text-white/50 ml-2 hidden sm:inline">Software Vala Enterprise</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onStreamingToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: streamingOn ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            color: streamingOn ? '#10b981' : '#ef4444',
          }}
        >
          {streamingOn ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {streamingOn ? 'LIVE' : 'OFFLINE'}
        </button>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
          title={`Auto-heal: ${healStatus} • Notifications: ${notifStatus}`}
          style={{ background: `${statusColor}22`, color: statusColor }}
        >
          {degraded ? <AlertTriangle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
          {statusLabel}
        </div>

        {degraded && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50"
            style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            RETRY
          </button>
        )}

        <span className="text-xs text-white/60 hidden md:inline">
          {userRole?.replace('_', ' ').toUpperCase() || 'USER'} • {user?.email?.split('@')[0]}
        </span>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative text-white/60 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: '#ef4444', color: 'white' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-lg shadow-2xl overflow-hidden"
              style={{ background: '#0f1c33', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAll}
                    className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-white/40">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isRead = readIds.has(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 border-b border-white/5 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {!isRead && (
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#3b82f6' }} />
                          )}
                          {isRead && (
                            <Check className="mt-0.5 w-3 h-3 text-white/30 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium truncate ${isRead ? 'text-white/50' : 'text-white'}`}>
                              {n.title}
                            </div>
                            <div className="text-[10px] text-white/40 mt-0.5">
                              {n.module} • {new Date(n.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="text-white/60 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
