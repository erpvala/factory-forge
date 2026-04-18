export interface ControlPanelModuleDefinition {
  id: string;
  path: string;
  aliases?: string[];
  owner: string;
  apiBase: string;
  dbTable: string;
  schemaVersion: 'v1' | 'v2' | 'v3';
  deprecateAfter?: string | null;
  allowedRoles: string[];
}

const CONTROL_PANEL_MODULE_SEEDS: Array<Pick<ControlPanelModuleDefinition, 'id' | 'allowedRoles' | 'aliases'>> = [
  { id: 'ceo-dashboard', aliases: ['/control-panel/ceo'], allowedRoles: ['boss_owner', 'ceo'] },
  { id: 'vala-ai', allowedRoles: ['boss_owner', 'ceo', 'super_admin'] },
  { id: 'server-manager', aliases: ['/control-panel/server'], allowedRoles: ['boss_owner', 'server_manager'] },
  { id: 'ai-api-manager', aliases: ['/control-panel/ai'], allowedRoles: ['boss_owner', 'api_ai_manager'] },
  { id: 'development-manager', aliases: ['/control-panel/development'], allowedRoles: ['boss_owner', 'developer', 'super_admin'] },
  { id: 'product-manager', aliases: ['/control-panel/product'], allowedRoles: ['product_manager', 'demo_manager', 'super_admin'] },
  { id: 'marketplace-manager', aliases: ['/control-panel/marketplace'], allowedRoles: ['marketplace_manager', 'super_admin', 'boss_owner', 'ceo'] },
  { id: 'demo-manager', allowedRoles: ['demo_manager', 'super_admin', 'boss_owner'] },
  { id: 'task-manager', aliases: ['/control-panel/tasks'], allowedRoles: ['task_manager', 'super_admin', 'boss_owner'] },
  { id: 'promise-tracker', allowedRoles: ['analytics_manager', 'super_admin', 'boss_owner'] },
  { id: 'assist-manager', allowedRoles: ['sales_support', 'super_admin', 'boss_owner'] },
  { id: 'asset-manager', allowedRoles: ['boss_owner', 'super_admin'] },
  { id: 'marketing-manager', allowedRoles: ['boss_owner', 'marketing_manager'] },
  { id: 'seo-manager', allowedRoles: ['boss_owner', 'seo_manager'] },
  { id: 'lead-manager', allowedRoles: ['lead_manager', 'super_admin', 'boss_owner', 'ceo'] },
  { id: 'sales-manager', allowedRoles: ['sales_support', 'super_admin'] },
  { id: 'customer-support', aliases: ['/control-panel/support'], allowedRoles: ['sales_support', 'super_admin'] },
  { id: 'franchise-manager', allowedRoles: ['franchise_manager', 'boss_owner', 'super_admin'] },
  { id: 'reseller-manager', allowedRoles: ['reseller_manager', 'super_admin', 'boss_owner'] },
  { id: 'influencer-manager', allowedRoles: ['boss_owner', 'super_admin'] },
  { id: 'continent-admin', allowedRoles: ['continent_admin', 'boss_owner', 'super_admin', 'ceo'] },
  { id: 'country-admin', allowedRoles: ['country_admin', 'area_manager', 'boss_owner', 'super_admin'] },
  { id: 'finance-manager', aliases: ['/control-panel/finance'], allowedRoles: ['finance_manager', 'super_admin'] },
  { id: 'legal-manager', allowedRoles: ['boss_owner', 'legal_manager'] },
  { id: 'developer-dashboard', aliases: ['/control-panel/developer'], allowedRoles: ['developer', 'super_admin'] },
  { id: 'reseller-dashboard', aliases: ['/control-panel/reseller'], allowedRoles: ['reseller', 'super_admin'] },
  { id: 'franchise-dashboard', aliases: ['/control-panel/franchise'], allowedRoles: ['franchise', 'franchise_owner', 'super_admin'] },
  { id: 'influencer-dashboard', aliases: ['/control-panel/influencer'], allowedRoles: ['influencer', 'super_admin'] },
  { id: 'pro-manager', allowedRoles: ['prime_user', 'super_admin'] },
  { id: 'security-manager', aliases: ['/control-panel/security'], allowedRoles: ['boss_owner'] },
  { id: 'system-settings', allowedRoles: ['super_admin'] },
  { id: 'license-manager', allowedRoles: ['finance_manager', 'super_admin', 'boss_owner'] },
  { id: 'demo-system-manager', allowedRoles: ['boss_owner', 'super_admin', 'demo_manager'] },
  { id: 'deployment-manager', allowedRoles: ['boss_owner', 'server_manager'] },
  { id: 'analytics-manager', aliases: ['/control-panel/analytics'], allowedRoles: ['analytics_manager', 'super_admin'] },
  { id: 'notification-manager', allowedRoles: ['super_admin'] },
  { id: 'integration-manager', allowedRoles: ['super_admin'] },
  { id: 'audit-logs-manager', allowedRoles: ['boss_owner', 'super_admin'] },
  { id: 'health', allowedRoles: ['boss_owner', 'ceo', 'super_admin'] },
  { id: 'hooks', aliases: ['/control-panel/hooks'], allowedRoles: ['boss_owner', 'ceo', 'super_admin', 'security_manager'] },
  { id: 'hr-manager', allowedRoles: ['hr_manager', 'boss_owner', 'super_admin'] },
];

const toDbTable = (moduleId: string) => moduleId.replace(/-/g, '_');
const toOwner = (allowedRoles: string[]) => allowedRoles[0] || 'boss_owner';

export const CONTROL_PANEL_MODULES: ControlPanelModuleDefinition[] = CONTROL_PANEL_MODULE_SEEDS.map((seed) => ({
  ...seed,
  path: `/control-panel/${seed.id}`,
  aliases: seed.aliases || [],
  owner: toOwner(seed.allowedRoles),
  apiBase: `/api/v1/${seed.id}`,
  dbTable: toDbTable(seed.id),
  schemaVersion: 'v1',
  deprecateAfter: null,
}));

const CONTROL_PANEL_ROUTE_MAP = new Map(CONTROL_PANEL_MODULES.map((moduleDef) => [moduleDef.id, moduleDef.path]));
const CONTROL_PANEL_PATH_SET = new Set(
  CONTROL_PANEL_MODULES.flatMap((moduleDef) => [moduleDef.path, ...(moduleDef.aliases || [])].map((path) => path.toLowerCase()))
);
const CONTROL_PANEL_API_SET = new Set(CONTROL_PANEL_MODULES.map((moduleDef) => moduleDef.apiBase.toLowerCase()));

export const isKnownControlPanelRoute = (pathname: string) => {
  const normalized = pathname.toLowerCase();
  return Array.from(CONTROL_PANEL_PATH_SET).some((basePath) => normalized === basePath || normalized.startsWith(`${basePath}/`));
};

export const isKnownControlPanelApi = (pathname: string) => {
  const normalized = pathname.toLowerCase();
  return Array.from(CONTROL_PANEL_API_SET).some((basePath) => normalized === basePath || normalized.startsWith(`${basePath}/`));
};

export const getModuleByRoute = (pathname: string) => {
  const normalized = pathname.toLowerCase();
  return CONTROL_PANEL_MODULES.find((moduleDef) => {
    const knownPaths = [moduleDef.path, ...(moduleDef.aliases || [])].map((path) => path.toLowerCase());
    return knownPaths.some((knownPath) => normalized === knownPath || normalized.startsWith(`${knownPath}/`));
  });
};

export const resolveControlPanelPath = (moduleId: string, splat?: string): string => {
  const basePath = CONTROL_PANEL_ROUTE_MAP.get(moduleId) ?? `/control-panel/${moduleId}`;
  const normalizedSplat = splat?.replace(/^\/+/, '');
  return normalizedSplat ? `${basePath}/${normalizedSplat}` : basePath;
};
