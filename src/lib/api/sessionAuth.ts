import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export type SessionShape = {
  user_id: string;
  role: string;
  permissions: string[];
  tenant_id: string;
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  boss_owner: ['users.read', 'orders.read', 'finance.read', 'system.read', 'system.write'],
  ceo: ['users.read', 'orders.read', 'finance.read', 'system.read'],
  super_admin: ['users.read', 'orders.read', 'finance.read', 'system.read', 'system.write'],
  developer: ['projects.write', 'deploy.write', 'logs.read'],
  reseller: ['orders.read', 'licenses.read', 'wallet.read'],
  franchise: ['orders.read', 'licenses.read', 'wallet.read'],
  influencer: ['orders.read', 'wallet.read'],
  support: ['tickets.read', 'tickets.write'],
};

export function getSessionFromRequest(request: NextRequest): SessionShape {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    throw new Error('session_missing_token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as {
    userId?: string;
    role?: string;
  };

  const role = String(decoded.role || 'user');
  const normalizedRole = role === 'boss' ? 'boss_owner' : role;
  const tenant_id = request.cookies.get('tenant_id')?.value || request.headers.get('x-tenant-id') || 'global';

  if (!tenant_id) {
    throw new Error('session_missing_tenant');
  }

  return {
    user_id: String(decoded.userId || ''),
    role: normalizedRole,
    permissions: ROLE_PERMISSIONS[normalizedRole] || ['dashboard.read'],
    tenant_id,
  };
}

export function requireRole(session: SessionShape, roles: string[]): void {
  if (!roles.includes(session.role)) {
    throw new Error(`session_role_forbidden:${session.role}`);
  }
}

export function requirePermission(session: SessionShape, permission: string): void {
  if (!session.permissions.includes(permission) && !session.permissions.includes('system.write')) {
    throw new Error(`session_permission_forbidden:${permission}`);
  }
}

export function requireTenant(session: SessionShape): void {
  if (!session.tenant_id || !String(session.tenant_id).trim()) {
    throw new Error('session_missing_tenant');
  }
}

export function requireCriticalActionApproval(request: NextRequest): void {
  const requireLock = (process.env.STRICT_ADMIN_ACTION_LOCK || 'true') === 'true';
  if (!requireLock) return;

  const confirmed = request.headers.get('x-confirm-action') === 'true';
  const twoFaVerified = request.headers.get('x-2fa-verified') === 'true';

  if (!confirmed) {
    throw new Error('critical_action_confirmation_required');
  }

  if (!twoFaVerified) {
    throw new Error('critical_action_2fa_required');
  }
}
