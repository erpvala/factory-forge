// @ts-nocheck

import { supabase } from '@/integrations/supabase/client';
import { CONTROL_PANEL_MODULES, isKnownControlPanelRoute } from '@/config/controlPanelModules';

const APP_VERSION = '2026.04.07';
const INCIDENT_KEY = 'system_sync_guard_incidents';

interface SyncValidationResult {
  ok: boolean;
  errors: string[];
}

const pushIncident = (reason: string, detail: string) => {
  if (typeof window === 'undefined') return;

  const payload = {
    reason,
    detail,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = JSON.parse(localStorage.getItem(INCIDENT_KEY) || '[]');
    const next = [...(Array.isArray(current) ? current : []), payload].slice(-100);
    localStorage.setItem(INCIDENT_KEY, JSON.stringify(next));
  } catch {
    // Keep guard resilient.
  }

  window.dispatchEvent(new CustomEvent('sv:system-sync-incident', { detail: payload }));
  console.error('[SYSTEM_SYNC_GUARD]', payload);
};

const checkVersionSync = () => {
  const backendVersion = import.meta.env.VITE_BACKEND_VERSION || APP_VERSION;
  if (backendVersion !== APP_VERSION) {
    return `version_mismatch frontend=${APP_VERSION} backend=${backendVersion}`;
  }
  return null;
};

const checkRegistryShape = () => {
  const errors: string[] = [];
  const seenKeys = new Set<string>();
  const seenRoutes = new Set<string>();
  const seenApis = new Set<string>();
  const seenTables = new Set<string>();

  for (const moduleDef of CONTROL_PANEL_MODULES) {
    const expectedRoute = `/control-panel/${moduleDef.id}`;
    const expectedApi = `/api/v1/${moduleDef.id}`;
    const expectedTable = moduleDef.id.replace(/-/g, '_');

    if (moduleDef.path !== expectedRoute) {
      errors.push(`route_mismatch:${moduleDef.id}:${moduleDef.path}`);
    }

    if (moduleDef.apiBase !== expectedApi) {
      errors.push(`api_mismatch:${moduleDef.id}:${moduleDef.apiBase}`);
    }

    if (moduleDef.dbTable !== expectedTable) {
      errors.push(`db_mismatch:${moduleDef.id}:${moduleDef.dbTable}`);
    }

    if (!moduleDef.schemaVersion) {
      errors.push(`schema_version_missing:${moduleDef.id}`);
    }

    if (!['v1', 'v2', 'v3'].includes(moduleDef.schemaVersion)) {
      errors.push(`schema_version_invalid:${moduleDef.id}:${moduleDef.schemaVersion}`);
    }

    const frontendSchemaVersion = String(import.meta.env.VITE_SCHEMA_VERSION || 'v1').toLowerCase();
    if (frontendSchemaVersion !== String(moduleDef.schemaVersion || 'v1').toLowerCase()) {
      errors.push(`schema_version_mismatch:${moduleDef.id}:ui=${frontendSchemaVersion}:api=${moduleDef.schemaVersion}`);
    }

    if (moduleDef.deprecateAfter) {
      const deadlineMs = Date.parse(moduleDef.deprecateAfter);
      if (!Number.isNaN(deadlineMs) && Date.now() >= deadlineMs && frontendSchemaVersion !== String(moduleDef.schemaVersion).toLowerCase()) {
        errors.push(`schema_version_deprecated:${moduleDef.id}:${frontendSchemaVersion}->${moduleDef.schemaVersion}`);
      }
    }

    if (seenKeys.has(moduleDef.id)) errors.push(`duplicate_key:${moduleDef.id}`);
    if (seenRoutes.has(moduleDef.path)) errors.push(`duplicate_route:${moduleDef.path}`);
    if (seenApis.has(moduleDef.apiBase)) errors.push(`duplicate_api:${moduleDef.apiBase}`);
    if (seenTables.has(moduleDef.dbTable)) errors.push(`duplicate_db_table:${moduleDef.dbTable}`);

    seenKeys.add(moduleDef.id);
    seenRoutes.add(moduleDef.path);
    seenApis.add(moduleDef.apiBase);
    seenTables.add(moduleDef.dbTable);
  }

  return errors;
};

const probeDbTable = async (tableName: string) => {
  try {
    const { error } = await (supabase as any)
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (!error) return null;

    // Permission denied means table exists but caller cannot read it.
    if (String(error.message || '').toLowerCase().includes('permission')) {
      return null;
    }

    return error.message || `db_probe_failed:${tableName}`;
  } catch (error) {
    return error instanceof Error ? error.message : `db_probe_exception:${tableName}`;
  }
};

const checkDbBindings = async () => {
  const dbErrors: string[] = [];
  const strictDb = (import.meta.env.VITE_STRICT_DB_SYNC || 'false') === 'true';

  if (!strictDb) {
    return dbErrors;
  }

  for (const moduleDef of CONTROL_PANEL_MODULES) {
    const failure = await probeDbTable(moduleDef.dbTable);
    if (failure) {
      dbErrors.push(`db_table_missing_or_unreachable:${moduleDef.dbTable}:${failure}`);
    }
  }

  return dbErrors;
};

export const validateSystemSynchronization = async (): Promise<SyncValidationResult> => {
  const errors = [
    ...checkRegistryShape(),
  ];

  const versionError = checkVersionSync();
  if (versionError) {
    errors.push(versionError);
  }

  const dbErrors = await checkDbBindings();
  errors.push(...dbErrors);

  return {
    ok: errors.length === 0,
    errors,
  };
};

export const enforceSystemSynchronizationOnBoot = async () => {
  const result = await validateSystemSynchronization();

  if (!result.ok) {
    for (const error of result.errors) {
      pushIncident('startup_sync_validation_failed', error);
    }
    return result;
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/login';
  if (currentPath.startsWith('/control-panel') && !isKnownControlPanelRoute(currentPath)) {
    const detail = `unknown_control_panel_route:${currentPath}`;
    pushIncident('startup_route_guard_failed', detail);
    return { ok: false, errors: [detail] };
  }

  return result;
};
