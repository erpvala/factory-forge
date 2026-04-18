// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { CONTROL_PANEL_MODULES } from '@/config/controlPanelModules';
import { beginFlow, completeFlow, failFlow, markFlowStep } from '@/services/flowLockRuntime';
import { sanitizeLogPayload } from '@/lib/security/dataPrivacy';
import { assertNewOnlyModeRuntime, assertNoLegacyReference } from '@/lib/security/systemMode';
import {
  assertContractRequest,
  assertContractResponse,
  resolveSchemaCompatibility,
} from '@/lib/contracts/schemaEvolution';
import { triggerGlobalHooks, triggerGlobalHooksAsync } from '@/lib/hooks/globalHookSystem';
import { enforceAiUsageLimit, enforceApiCostLimit, trackApiUsageCost } from '@/services/costProfitGuard';

interface EdgeRouteOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  module?: string;
  cacheTtlMs?: number;
}

interface EdgeRouteResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  status: number;
}

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_CACHE_TTL_MS = 5000;
const CRITICAL_LATENCY_MS = 200;
const NORMAL_LATENCY_MS = 500;
const STATIC_APP_SIGNATURE = 'a2a387182eec7c53edf651322b032f5b58247a6d8a7fd3841d4fc8ee981566e4';

const responseCache = new Map<string, { expiresAt: number; value: EdgeRouteResponse<unknown> }>();
const MODULE_API_BASE_MAP = new Map(CONTROL_PANEL_MODULES.map((moduleDef) => [moduleDef.id, moduleDef.apiBase]));

function invalidateCacheByPrefix(prefix: string) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(`${prefix}:`)) {
      responseCache.delete(key);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffDelay(attempt: number) {
  return Math.min(400 * 2 ** attempt, 2000);
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function inferModule(functionName: string) {
  if (functionName.includes('finance')) return 'finance';
  if (functionName.includes('marketplace')) return 'marketplace';
  if (functionName.includes('chat')) return 'chat';
  if (functionName.includes('promise')) return 'promise';
  if (functionName.includes('security') || functionName.includes('auth')) return 'security';
  return 'platform';
}

function getFallbackBaseUrls() {
  const raw = import.meta.env.VITE_EDGE_FALLBACK_URLS;
  if (!raw) return [] as string[];

  return String(raw)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function getDeviceId() {
  let deviceId = localStorage.getItem('device_fingerprint');
  if (!deviceId) {
    const fingerprint = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`;
    deviceId = btoa(fingerprint).slice(0, 32);
    localStorage.setItem('device_fingerprint', deviceId);
  }

  return deviceId;
}

async function logSystemEvent(payload: Record<string, unknown>) {
  try {
    await (supabase as any).from('system_logs').insert(sanitizeLogPayload(payload));
  } catch {
    // Logging failures must not break the request path.
  }
}

async function logErrorEvent(payload: Record<string, unknown>) {
  try {
    await (supabase as any).from('error_logs').insert(sanitizeLogPayload(payload));
  } catch {
    // Logging failures must not break the request path.
  }
}

async function triggerAutoHeal(module: string, reason: string) {
  try {
    await supabase.functions.invoke('ai-auto-heal', {
      body: {
        action: 'restart_module',
        data: {
          module,
          reason,
        },
      },
    });
  } catch {
    // Auto-heal is best effort.
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function buildEdgeUrl(baseUrl: string, functionName: string, path = '', query?: EdgeRouteOptions['query']) {
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(`${baseUrl}/functions/v1/${functionName}${normalizedPath ? `/${normalizedPath}` : ''}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function callEdgeRoute<T>(
  functionName: string,
  path = '',
  options: EdgeRouteOptions = {},
): Promise<EdgeRouteResponse<T>> {
  assertNewOnlyModeRuntime(import.meta.env.VITE_SYSTEM_MODE, import.meta.env.VITE_ALLOW_LEGACY_API);
  assertNoLegacyReference(functionName, 'functionName');
  assertNoLegacyReference(path, 'path');

  const method = options.method || 'GET';
  const moduleName = options.module || inferModule(functionName);
  const moduleDefinition = CONTROL_PANEL_MODULES.find((mod) => mod.id === moduleName) || null;
  const requestedSchemaVersion = options.headers?.['X-Schema-Version'];
  const compatibility = resolveSchemaCompatibility({
    moduleKey: moduleName,
    serverVersion: moduleDefinition?.schemaVersion || 'v1',
    requestedVersion: requestedSchemaVersion,
    deprecateAfter: moduleDefinition?.deprecateAfter,
  });
  if (compatibility.forceUpgrade) {
    throw new Error(`schema_upgrade_required:${compatibility.reason || moduleName}`);
  }

  const traceId = options.headers?.['X-Trace-Id'] || createRequestId();
  const idempotencyKey = options.headers?.['X-Idempotency-Key'] || (method === 'GET' ? '' : createRequestId());

  if (method !== 'GET') {
    assertContractRequest(moduleName, options.body || {});
  }

  const cacheKey = `${functionName}:${path}:${JSON.stringify(options.query || {})}`;
  let currentUserId = 'anonymous';
  let tenantId = '';
  let userPlan: 'free' | 'paid' = 'free';

  if (method === 'GET') {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      trackApiUsageCost({
        module: moduleName,
        userId: currentUserId,
        tenantId,
        durationMs: 0,
        cached: true,
        isAi: functionName.includes('ai') || moduleName.includes('ai'),
        tokens: 0,
      });
      return cached.value as EdgeRouteResponse<T>;
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const requestId = createRequestId();
  const deviceId = await getDeviceId();
  const currentPathname = (typeof window !== 'undefined' ? window.location.pathname : '/').toLowerCase();
  const isAuthFunction = functionName.includes('auth') || functionName.includes('login') || functionName.includes('apply');
  const isAllowedCaller = currentPathname.startsWith('/control-panel') || currentPathname.startsWith('/login') || isAuthFunction;

  if (!isAllowedCaller) {
    throw new Error(`Blocked API call outside allowed origin path: ${currentPathname}`);
  }

  const appSignature = import.meta.env.VITE_APP_SIGNATURE || STATIC_APP_SIGNATURE;
  const controlPanelOrigin = `${window.location.origin}/control-panel`;
  const requestStartedAt = performance.now();
  currentUserId = session?.user?.id || 'anonymous';
  tenantId = (session?.user as any)?.user_metadata?.tenant_id || '';
  userPlan = ((session?.user as any)?.user_metadata?.plan || 'free') as 'free' | 'paid';

  enforceApiCostLimit({ userId: currentUserId, tenantId });
  if (functionName.includes('ai') || moduleName.includes('ai')) {
    enforceAiUsageLimit({
      userId: currentUserId,
      plan: userPlan,
      tokenEstimate: typeof options.body === 'string' ? options.body.length : 1000,
    });
  }

  const baseUrls = [import.meta.env.VITE_SUPABASE_URL, ...getFallbackBaseUrls()].filter(Boolean);
  const failures: string[] = [];

  for (let baseIndex = 0; baseIndex < baseUrls.length; baseIndex += 1) {
    const baseUrl = baseUrls[baseIndex];

    for (let attempt = 0; attempt < DEFAULT_RETRY_COUNT; attempt += 1) {
      try {
        const response = await fetchWithTimeout(
          buildEdgeUrl(baseUrl, functionName, path, options.query),
          {
            method,
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'x-device-id': deviceId,
              'x-request-id': requestId,
              'x-trace-id': traceId,
              ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {}),
              'X-Schema-Version': compatibility.acceptedVersion,
              'X-App-Signature': appSignature,
              'X-Control-Panel-Origin': controlPanelOrigin,
              'X-Control-Panel-Path': currentPathname,
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
              ...(options.headers || {}),
            },
            body: options.body === undefined || method === 'GET' ? undefined : JSON.stringify(options.body),
          },
          DEFAULT_TIMEOUT_MS,
        );

        const payload = await response.json().catch(() => null);
        assertContractResponse(moduleName, payload || {});
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || payload?.message || `Edge route failed with status ${response.status}`);
        }

        const result: EdgeRouteResponse<T> = {
          success: true,
          data: payload.data as T,
          status: response.status,
        };

        const durationMs = Math.round(performance.now() - requestStartedAt);
        if (durationMs > NORMAL_LATENCY_MS) {
          window.dispatchEvent(new CustomEvent('sv:latency-budget-warning', {
            detail: { functionName, durationMs, threshold: NORMAL_LATENCY_MS },
          }));
        }

        if (method === 'GET') {
          responseCache.set(cacheKey, {
            expiresAt: Date.now() + (options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS),
            value: result as EdgeRouteResponse<unknown>,
          });
        } else {
          invalidateCacheByPrefix(functionName);
        }

        trackApiUsageCost({
          module: moduleName,
          userId: currentUserId,
          tenantId,
          durationMs,
          cached: false,
          isAi: functionName.includes('ai') || moduleName.includes('ai'),
          tokens: typeof options.body === 'string' ? options.body.length : 1000,
        });

        void logSystemEvent({
          module: moduleName,
          action: `${method} ${functionName}/${path || ''}`.trim(),
          status: 'success',
          request_id: requestId,
          user_id: session?.user?.id || null,
          duration_ms: durationMs,
          latency_budget: durationMs <= CRITICAL_LATENCY_MS ? 'critical' : durationMs <= NORMAL_LATENCY_MS ? 'normal' : 'degraded',
          metadata: {
            function_name: functionName,
            path,
            attempts: attempt + 1,
            failover_used: baseIndex > 0,
            response_status: response.status,
          },
        });

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown edge transport failure';
        failures.push(`${baseUrl} [attempt ${attempt + 1}]: ${message}`);

        if (attempt < DEFAULT_RETRY_COUNT - 1) {
          await sleep(getBackoffDelay(attempt));
        }
      }
    }
  }

  const finalMessage = failures[failures.length - 1] || 'Unknown edge route failure';

  void logErrorEvent({
    module: moduleName,
    endpoint: `${functionName}/${path || ''}`.replace(/\/$/, ''),
    error: finalMessage,
    error_code: 'EDGE_ROUTE_FAILED',
    fix_status: 'queued',
    severity: 'high',
    request_id: requestId,
    user_id: session?.user?.id || null,
    metadata: {
      function_name: functionName,
      path,
      method,
      failures,
      fallback_attempted: baseUrls.length > 1,
    },
  });

  void logSystemEvent({
    module: moduleName,
    action: `${method} ${functionName}/${path || ''}`.trim(),
    status: 'failed',
    request_id: requestId,
    user_id: session?.user?.id || null,
    duration_ms: Math.round(performance.now() - requestStartedAt),
    metadata: {
      function_name: functionName,
      path,
      failures,
    },
  });

  void triggerAutoHeal(moduleName, finalMessage);
  window.dispatchEvent(new CustomEvent('sv:api-failure', { detail: { module: moduleName, error: finalMessage, requestId } }));

  throw new Error(finalMessage);
}

export async function callModuleApi<T>(
  moduleKey: string,
  path = '',
  options: EdgeRouteOptions = {},
): Promise<EdgeRouteResponse<T>> {
  const apiBase = MODULE_API_BASE_MAP.get(moduleKey);
  if (!apiBase) {
    throw new Error(`Unknown module registry key: ${moduleKey}`);
  }

  const normalizedFunctionName = apiBase.replace(/^\/api\/v1\//, '');
  const flowId = beginFlow(moduleKey, `${options.method || 'GET'}:${path || 'root'}`);
  const traceId = options.headers?.['X-Trace-Id'] || createRequestId();
  const idempotencyKey = options.headers?.['X-Idempotency-Key'] || createRequestId();

  const inferHookEvent = () => {
    const normalizedPath = `${moduleKey}/${path}`.toLowerCase();
    if (normalizedPath.includes('payment') || normalizedPath.includes('order')) return 'order_paid';
    if (normalizedPath.includes('apply') || normalizedPath.includes('application')) return 'apply_submitted';
    if (normalizedPath.includes('ticket') || normalizedPath.includes('support')) return 'ticket_created';
    if (normalizedPath.includes('product') || normalizedPath.includes('publish')) return 'product_published';
    return `${moduleKey.replace(/-/g, '_')}_action`;
  };

  try {
    await triggerGlobalHooks({
      event: inferHookEvent(),
      module: moduleKey,
      payload: {
        module_key: moduleKey,
        path,
        method: options.method || 'GET',
        phase: 'pre_action',
        trace_id: traceId,
        idempotency_key: idempotencyKey,
      },
      hookType: 'pre_action_hook',
      traceId,
    });

    markFlowStep(flowId, 'api');

    const response = await callEdgeRoute<T>(normalizedFunctionName, path, {
      ...options,
      module: moduleKey,
      headers: {
        ...(options.headers || {}),
        'X-Trace-Id': traceId,
        'X-Idempotency-Key': idempotencyKey,
        'X-Module-Key': moduleKey,
        'X-Module-Api-Base': apiBase,
      },
    });

    markFlowStep(flowId, 'db');

    triggerGlobalHooksAsync({
      event: inferHookEvent(),
      module: moduleKey,
      payload: {
        module_key: moduleKey,
        path,
        method: options.method || 'GET',
        phase: 'post_action',
        trace_id: traceId,
        idempotency_key: idempotencyKey,
      },
      hookType: 'post_action_hook',
      traceId,
    });

    markFlowStep(flowId, 'event');
    markFlowStep(flowId, 'ui-refresh');
    completeFlow(flowId);
    return response;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'module_api_failed';
    await triggerGlobalHooks({
      event: 'hook_failed',
      module: moduleKey,
      payload: {
        module_key: moduleKey,
        path,
        method: options.method || 'GET',
        phase: 'error',
        reason,
        trace_id: traceId,
      },
      hookType: 'error_hook',
      traceId,
    }).catch(() => {
      // fail-safe: never hide original API error
    });

    failFlow(flowId, error instanceof Error ? error.message : 'module_api_failed');
    throw error;
  }
}
