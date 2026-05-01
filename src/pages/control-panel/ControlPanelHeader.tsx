// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Shield, Wifi, WifiOff, Bell, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchNotifications, pingAutoHeal, NotificationItem } from '@/services/backgroundServices';

interface ControlPanelHeaderProps {
  streamingOn: boolean;
  onStreamingToggle: () => void;
}

export function ControlPanelHeader({ streamingOn, onStreamingToggle }: ControlPanelHeaderProps) {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const items = await fetchNotifications();
      if (!cancelled) setNotifications(items);
    };
    load();
    pingAutoHeal();
    const notifTimer = setInterval(load, 60_000);
    const healTimer = setInterval(() => pingAutoHeal(), 120_000);
    return () => {
      cancelled = true;
      clearInterval(notifTimer);
      clearInterval(healTimer);
    };
  }, []);

  const handleNotifications = () => {
    if (notifications.length === 0) {
      toast.info('No new notifications');
      return;
    }
    toast.info(`${notifications.length} recent activity item(s)`, {
      description: notifications.slice(0, 3).map((n) => n.title).join(' • '),
    });
  };

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

        <span className="text-xs text-white/60 hidden md:inline">
          {userRole?.replace('_', ' ').toUpperCase() || 'USER'} • {user?.email?.split('@')[0]}
        </span>

        <button
          onClick={handleNotifications}
          className="relative text-white/60 hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: '#ef4444', color: 'white' }}
            >
              {notifications.length > 99 ? '99+' : notifications.length}
            </span>
          )}
        </button>

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
