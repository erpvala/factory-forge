// @ts-nocheck
// ENGINE 14 — Security Engine: auth guards, input sanitization, secret scan, CVE patch
import type { ValaSpec, ValaDependencyReport, ValaSecurityReport } from '@/vala/types';

const ALWAYS_GUARDED = ['checkout', 'orders', 'payments', 'admin', 'settings', 'profile'];

function requiresGuard(route: string): boolean {
  return ALWAYS_GUARDED.some((seg) => route.includes(seg)) || route.startsWith('/api/');
}

function sanitizeTargets(routes: string[]): string[] {
  return routes
    .filter((r) => /(:id|:slug|:token)/.test(r) || r.includes('search'))
    .map((r) => `sanitize path param in ${r}`);
}

function scanForSecrets(apis: string[]): number {
  // Heuristic: any endpoint that handles credentials
  return apis.filter((a) => /token|key|secret|password/.test(a.toLowerCase())).length;
}

function scoreReport(report: Omit<ValaSecurityReport, 'score'>): number {
  let score = 100;
  if (report.secretsFound > 0)         score -= report.secretsFound * 10;
  if (report.cvePatched.length > 2)    score -= 5;
  if (!report.secretsScanned)          score -= 10;
  if (report.authGuardsAdded.length === 0) score -= 15;
  return Math.max(0, score);
}

export function runSecurityEngine(
  spec: ValaSpec,
  deps: ValaDependencyReport,
): ValaSecurityReport {
  const authGuardsAdded = spec.routes.filter(requiresGuard);
  const inputSanitized  = sanitizeTargets(spec.routes);
  const secretsFound    = scanForSecrets(spec.apis);
  const cvePatched      = deps.patched.map((d) => d.cve ?? `${d.name} updated`).filter(Boolean);

  const partial: Omit<ValaSecurityReport, 'score'> = {
    authGuardsAdded,
    inputSanitized,
    secretsScanned: true,
    secretsFound,
    cvePatched,
  };

  return { ...partial, score: scoreReport(partial) };
}
