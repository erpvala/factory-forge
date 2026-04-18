// @ts-nocheck

import policy from '../../config/account-security-policy.json';

const EVENTS_KEY = 'account_security_events';

const readEvents = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeEvents = (events: any[]) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-1000)));
};

const pushEvent = (type: string, detail: Record<string, unknown>) => {
  const events = readEvents();
  const payload = { type, detail, timestamp: new Date().toISOString() };
  events.push(payload);
  writeEvents(events);
  window.dispatchEvent(new CustomEvent('sv:account-security-alert', { detail: payload }));
};

export const installAccountTakeoverGuard = () => {
  if (typeof window === 'undefined') return () => {};

  const cfg = policy as any;
  const anomalyLogout = Boolean(cfg.takeover_detection?.anomaly_auto_logout);
  const threshold = Number(cfg.lock_policy?.failed_login_threshold || 5);

  const failedKey = 'failed_login_attempts';
  const sessionKey = 'active_session_count';

  const onVisibility = () => {
    const fails = Number(localStorage.getItem(failedKey) || 0);
    if (fails >= threshold) {
      pushEvent('account_locked_threshold', { fails, threshold });
      localStorage.setItem('account_locked', 'true');
    }

    const sessions = Number(localStorage.getItem(sessionKey) || 1);
    const maxSessions = Number(cfg.session_policy?.max_active_sessions || 3);
    if (sessions > maxSessions) {
      pushEvent('session_limit_exceeded', { sessions, maxSessions });
      if (anomalyLogout) {
        localStorage.setItem('force_logout', 'true');
        window.location.replace('/login');
      }
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onVisibility);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', onVisibility);
  };
};
