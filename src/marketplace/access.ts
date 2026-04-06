// @ts-nocheck
import type { AppRole } from '@/hooks/useAuth';

export type MarketplaceActorRole = 'user' | 'admin' | 'reseller' | 'franchise';
export type MarketplacePermission = 'view' | 'buy' | 'manage';

const ADMIN_ROLES: AppRole[] = ['boss_owner', 'ceo', 'super_admin', 'admin', 'marketplace_manager'];
const RESELLER_ROLES: AppRole[] = ['reseller', 'reseller_manager'];
const FRANCHISE_ROLES: AppRole[] = ['franchise_owner', 'franchise_manager'];

export function resolveMarketplaceRole(roles: AppRole[]): MarketplaceActorRole {
  if (roles.some((role) => ADMIN_ROLES.includes(role))) return 'admin';
  if (roles.some((role) => RESELLER_ROLES.includes(role))) return 'reseller';
  if (roles.some((role) => FRANCHISE_ROLES.includes(role))) return 'franchise';
  return 'user';
}

export function hasMarketplacePermission(roles: AppRole[], permission: MarketplacePermission): boolean {
  const actor = resolveMarketplaceRole(roles);
  if (permission === 'view') return true;
  if (permission === 'buy') return actor === 'user' || actor === 'admin' || actor === 'reseller' || actor === 'franchise';
  if (permission === 'manage') return actor === 'admin';
  return false;
}
