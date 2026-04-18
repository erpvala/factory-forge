// @ts-nocheck
import { ROLE_DASHBOARD_ROUTE } from '@/routes/routes';

export type DemoTier = 'master' | 'admin' | 'manager' | 'staff';

export interface DemoRoleAccount {
  id: string;
  role: string;
  roleKey: string;
  email: string;
  password: string;
  redirectPath: string;
  tier: DemoTier;
  description: string;
}

const TIER_MAP: Record<string, DemoTier> = {
  boss_owner: 'master',
  ceo: 'master',
  super_admin: 'admin',
  admin: 'admin',
  security_manager: 'admin',
  audit_manager: 'admin',
  finance_manager: 'manager',
  marketing_manager: 'manager',
  seo_manager: 'manager',
  lead_manager: 'manager',
  reseller_manager: 'manager',
  franchise_manager: 'manager',
  marketplace_manager: 'manager',
  deployment_manager: 'manager',
  integration_manager: 'manager',
  analytics_manager: 'manager',
  notification_manager: 'manager',
  product_manager: 'manager',
  developer: 'staff',
  server_manager: 'staff',
  reseller: 'staff',
  franchise_owner: 'staff',
  influencer: 'staff',
  user: 'staff',
};

function toLabel(roleKey: string): string {
  return roleKey.split('_').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
}

function tierFor(roleKey: string): DemoTier {
  return TIER_MAP[roleKey] || 'staff';
}

function passwordFor(roleKey: string): string {
  return `Vala@${roleKey.replace(/_/g, '')}2025`;
}

function emailFor(roleKey: string): string {
  return `${roleKey.replace(/_/g, '')}@softwarevala.com`;
}

function descriptionFor(roleKey: string, redirectPath: string): string {
  return `${toLabel(roleKey)} demo access to ${redirectPath}`;
}

export function getDemoRoleAccounts(): DemoRoleAccount[] {
  return Object.entries(ROLE_DASHBOARD_ROUTE)
    .filter(([roleKey, redirectPath]) => Boolean(redirectPath))
    .map(([roleKey, redirectPath]) => ({
      id: roleKey,
      role: toLabel(roleKey),
      roleKey,
      email: emailFor(roleKey),
      password: passwordFor(roleKey),
      redirectPath,
      tier: tierFor(roleKey),
      description: descriptionFor(roleKey, redirectPath),
    }))
    .sort((a, b) => a.role.localeCompare(b.role));
}
