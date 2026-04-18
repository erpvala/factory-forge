export const BOSS_PANEL_SECTIONS = [
  { id: 'full-auto', label: 'Full Auto System' },
  { id: 'live-activity', label: 'Live Activity Stream' },
  { id: 'hierarchy', label: 'Hierarchy Control' },
  { id: 'super-admins', label: 'Control Operators' },
  { id: 'roles', label: 'Roles and Permissions' },
  { id: 'modules', label: 'System Modules' },
  { id: 'products', label: 'Product and Demo' },
  { id: 'vala-ai', label: 'VALA AI' },
  { id: 'revenue', label: 'Revenue Snapshot' },
  { id: 'audit', label: 'Audit and Blackbox' },
  { id: 'security', label: 'Security and Legal' },
  { id: 'codepilot', label: 'CodePilot' },
  { id: 'server-hosting', label: 'CodeLab Cloud' },
  { id: 'settings', label: 'Settings' },
] as const;

export type BossPanelSection = (typeof BOSS_PANEL_SECTIONS)[number]['id'];
