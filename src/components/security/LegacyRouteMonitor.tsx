// @ts-nocheck
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRouteViolation } from '@/lib/security/routeLock';

export default function LegacyRouteMonitor() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const violation = getRouteViolation(location.pathname);
    if (!violation) return;

    console.error('[ROUTE_LOCK]', violation);
    navigate('/404', {
      replace: true,
      state: {
        routeLockViolation: violation,
        from: location.pathname,
      },
    });
  }, [location.pathname, navigate]);

  return null;
}
