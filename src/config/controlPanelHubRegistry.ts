import { CONTROL_PANEL_MODULES } from '@/config/controlPanelModules';

export type ControlPanelWorkspaceKind = 'overview' | 'applications' | 'notifications' | 'module';

export interface ControlPanelWorkspaceEntry {
  key: string;
  label: string;
  description: string;
  segment: string;
  icon: string;
  kind: ControlPanelWorkspaceKind;
  moduleId?: string;
  featureRank?: number;
  allowedRoles?: string[];
}

const MODULE_ROLE_MAP = new Map(CONTROL_PANEL_MODULES.map((moduleDef) => [moduleDef.id, moduleDef.allowedRoles]));

const FEATURED_MODULE_WORKSPACES: ControlPanelWorkspaceEntry[] = [
  { key: 'overview', label: 'Overview', description: 'System-wide command center', segment: '', icon: 'layout', kind: 'overview', featureRank: 0 },
  { key: 'applications', label: 'Applications', description: 'Pending approvals and onboarding', segment: 'applications', icon: 'badge-check', kind: 'applications', featureRank: 1, allowedRoles: ['boss_owner', 'ceo', 'super_admin', 'support'] },
  { key: 'notifications', label: 'Notifications', description: 'Realtime system events', segment: 'notifications', icon: 'bell', kind: 'notifications', featureRank: 2 },
  { key: 'ceo', label: 'CEO', description: 'Executive control workspace', segment: 'ceo', icon: 'briefcase', kind: 'module', moduleId: 'ceo-dashboard', featureRank: 3 },
  { key: 'ai', label: 'AI API', description: 'AI integrations and routing', segment: 'ai', icon: 'bot', kind: 'module', moduleId: 'ai-api-manager', featureRank: 4 },
  { key: 'development', label: 'Development', description: 'Developer operations and deployment flow', segment: 'development', icon: 'code-2', kind: 'module', moduleId: 'development-manager', featureRank: 5 },
  { key: 'product', label: 'Product', description: 'Product demos and releases', segment: 'product', icon: 'package', kind: 'module', moduleId: 'product-manager', featureRank: 6 },
  { key: 'marketplace', label: 'Marketplace', description: 'Orders, listings, and marketplace health', segment: 'marketplace', icon: 'shopping-bag', kind: 'module', moduleId: 'marketplace-manager', featureRank: 7 },
  { key: 'server', label: 'Server', description: 'Infrastructure and deployment controls', segment: 'server', icon: 'server', kind: 'module', moduleId: 'server-manager', featureRank: 8 },
  { key: 'security', label: 'Security', description: 'Security incidents and controls', segment: 'security', icon: 'shield', kind: 'module', moduleId: 'security-manager', featureRank: 9 },
  { key: 'finance', label: 'Finance', description: 'Revenue, payouts, and finance status', segment: 'finance', icon: 'wallet', kind: 'module', moduleId: 'finance-manager', featureRank: 10 },
  { key: 'support', label: 'Support', description: 'Customer support and tickets', segment: 'support', icon: 'life-buoy', kind: 'module', moduleId: 'customer-support', featureRank: 11 },
  { key: 'analytics', label: 'Analytics', description: 'Performance and analytics monitoring', segment: 'analytics', icon: 'bar-chart-3', kind: 'module', moduleId: 'analytics-manager', featureRank: 12 },
  { key: 'hooks', label: 'Hooks', description: 'Global hook orchestration', segment: 'hooks', icon: 'workflow', kind: 'module', moduleId: 'hooks', featureRank: 13 },
  { key: 'health', label: 'Health', description: 'System health and flow diagnostics', segment: 'health', icon: 'activity', kind: 'module', moduleId: 'health', featureRank: 14 },
  { key: 'developer', label: 'Developer', description: 'Developer dashboard', segment: 'developer', icon: 'terminal', kind: 'module', moduleId: 'developer-dashboard', featureRank: 15 },
  { key: 'reseller', label: 'Reseller', description: 'Reseller dashboard', segment: 'reseller', icon: 'handshake', kind: 'module', moduleId: 'reseller-dashboard', featureRank: 16 },
  { key: 'franchise', label: 'Franchise', description: 'Franchise dashboard', segment: 'franchise', icon: 'building-2', kind: 'module', moduleId: 'franchise-dashboard', featureRank: 17 },
  { key: 'influencer', label: 'Influencer', description: 'Influencer dashboard', segment: 'influencer', icon: 'megaphone', kind: 'module', moduleId: 'influencer-dashboard', featureRank: 18 },
  { key: 'reseller-manager', label: 'Reseller Manager', description: 'Manage resellers, applications and quality', segment: 'reseller-manager', icon: 'handshake', kind: 'module', moduleId: 'reseller-manager', featureRank: 19 },
  { key: 'franchise-manager', label: 'Franchise Manager', description: 'Regional franchise control tower', segment: 'franchise-manager', icon: 'building-2', kind: 'module', moduleId: 'franchise-manager', featureRank: 20 },
  { key: 'influencer-manager', label: 'Influencer Manager', description: 'Manage influencers, campaigns and payouts', segment: 'influencer-manager', icon: 'megaphone', kind: 'module', moduleId: 'influencer-manager', featureRank: 21 },
  { key: 'marketing-manager', label: 'Marketing Manager', description: 'Campaigns, channels and demand engine', segment: 'marketing-manager', icon: 'bar-chart-3', kind: 'module', moduleId: 'marketing-manager', featureRank: 22 },
  { key: 'seo-manager', label: 'SEO Manager', description: 'SEO health, keywords and page optimization', segment: 'seo-manager', icon: 'activity', kind: 'module', moduleId: 'seo-manager', featureRank: 23 },
  { key: 'legal-manager', label: 'Legal Manager', description: 'Compliance, policy and trademark monitor', segment: 'legal-manager', icon: 'shield', kind: 'module', moduleId: 'legal-manager', featureRank: 24 },
  { key: 'task-manager', label: 'Task Manager', description: 'Tasks, SLA breaches and escalations', segment: 'task-manager', icon: 'workflow', kind: 'module', moduleId: 'task-manager', featureRank: 25 },
  { key: 'assist-manager', label: 'Assist Manager', description: 'Sales support and assistance queue', segment: 'assist-manager', icon: 'life-buoy', kind: 'module', moduleId: 'assist-manager', featureRank: 26 },
  { key: 'lead-manager', label: 'Lead Manager', description: 'Lead pipeline, quality and conversions', segment: 'lead-manager', icon: 'briefcase', kind: 'module', moduleId: 'lead-manager', featureRank: 27 },
  { key: 'hr-manager', label: 'HR Manager', description: 'Hiring, onboarding and employee records', segment: 'hr-manager', icon: 'users', kind: 'module', moduleId: 'hr-manager', featureRank: 28 },
];

const FEATURED_MODULE_IDS = new Set(FEATURED_MODULE_WORKSPACES.map((entry) => entry.moduleId).filter(Boolean));

const GENERATED_MODULE_WORKSPACES: ControlPanelWorkspaceEntry[] = CONTROL_PANEL_MODULES
  .filter((moduleDef) => !FEATURED_MODULE_IDS.has(moduleDef.id))
  .map((moduleDef) => ({
    key: moduleDef.id,
    label: moduleDef.id.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    description: `${moduleDef.id.replace(/-/g, ' ')} workspace`,
    segment: moduleDef.id,
    icon: 'panel-left',
    kind: 'module' as const,
    moduleId: moduleDef.id,
  }));

export const CONTROL_PANEL_WORKSPACES: ControlPanelWorkspaceEntry[] = [
  ...FEATURED_MODULE_WORKSPACES,
  ...GENERATED_MODULE_WORKSPACES,
].map((entry) => ({
  ...entry,
  allowedRoles: entry.allowedRoles || (entry.moduleId ? MODULE_ROLE_MAP.get(entry.moduleId) || [] : []),
}));

const WORKSPACE_BY_KEY = new Map(CONTROL_PANEL_WORKSPACES.map((entry) => [entry.key, entry]));
const WORKSPACE_BY_SEGMENT = new Map(CONTROL_PANEL_WORKSPACES.map((entry) => [entry.segment.toLowerCase(), entry]));
const WORKSPACE_BY_MODULE = new Map(
  CONTROL_PANEL_WORKSPACES
    .filter((entry) => entry.moduleId)
    .map((entry) => [entry.moduleId as string, entry]),
);

export const getControlPanelWorkspaceHref = (workspace: ControlPanelWorkspaceEntry) => {
  return workspace.segment ? `/control-panel/${workspace.segment}` : '/control-panel';
};

export const getControlPanelWorkspaceByKey = (key: string) => {
  return WORKSPACE_BY_KEY.get(key);
};

export const getControlPanelWorkspaceBySegment = (segment?: string | null) => {
  if (!segment) {
    return WORKSPACE_BY_KEY.get('overview') || CONTROL_PANEL_WORKSPACES[0];
  }
  return WORKSPACE_BY_SEGMENT.get(segment.toLowerCase()) || null;
};

export const getControlPanelWorkspaceByModuleId = (moduleId?: string | null) => {
  if (!moduleId) return null;
  return WORKSPACE_BY_MODULE.get(moduleId) || null;
};

export const getVisibleControlPanelWorkspaces = (roles: string[]) => {
  return CONTROL_PANEL_WORKSPACES.filter((entry) => {
    if (!entry.allowedRoles || entry.allowedRoles.length === 0) {
      return true;
    }
    return roles.some((role) => entry.allowedRoles?.includes(role));
  }).sort((left, right) => (left.featureRank ?? 1000) - (right.featureRank ?? 1000));
};
