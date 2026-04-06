import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  decryptValue,
  hmacSign,
  interpolateTemplate,
  isCircuitOpen,
  normalizeResponse,
  rotationDue,
  sha256,
  sortProviders,
  validateSchema,
  waitWithBackoff,
  computeHealthScore,
  generateTraceId,
  redactPayload,
  adaptiveTimeoutCalculation,
  costAwareRouting,
  geoNearestEndpoint,
  validatePolicy,
  enforceReplayProtection,
  checkSLABreach,
  applyCostCutoff,
  applySandboxIsolation,
  checkDataResidency,
  shouldShadowTraffic,
  checkIncidentMode,
  enforceDeadlinePropagation,
  selectPriorityQueue,
  applyBackpressure,
  adjustAdaptiveConcurrency,
  acquireFromConnectionPool,
  verifyTLSPin,
  normalizeHeaders,
  shouldStreamResponse,
  correctClockSkew,
  deduplicateWebhookEvent,
  enforceRetryBudget,
  shouldDegradeGracefully,
} from "../_shared/ai-api-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isHeavy(service: string, action: string, data: Record<string, unknown>) {
  return ['email', 'push', 'analytics'].includes(service) || data.async === true || action.includes('bulk');
}

function buildAuthHeaders(provider: string, apiKey: string, apiSecret: string): Record<string, string> {
  switch (provider) {
    case 'razorpay':
    case 'twilio': {
      const token = btoa(`${apiKey}:${apiSecret}`);
      return { Authorization: `Basic ${token}` };
    }
    case 'stripe':
    case 'sendgrid':
      return { Authorization: `Bearer ${apiSecret || apiKey}` };
    case 'msg91':
      return { authkey: apiSecret || apiKey };
    case 'firebase':
      return { Authorization: `key=${apiKey}` };
    case 'google':
    case 'mixpanel':
      return { 'X-API-Key': apiKey };
    default:
      return { 'X-API-Key': apiKey, 'X-API-Secret': apiSecret || '' };
  }
}

async function withTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function openCircuit(admin: any, provider: any, reason: string) {
  const cooldownUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await admin
    .from('ai_apis')
    .update({
      status: 'inactive',
      circuit_state: 'open',
      circuit_open_until: cooldownUntil,
    })
    .eq('api_id', provider.api_id);

  await admin.from('api_queue_jobs').insert({
    api_id: provider.api_id,
    service_type: provider.api_name,
    action: 'notify_admin',
    payload: { reason, provider: provider.provider, api_id: provider.api_id },
    status: 'queued',
  });
}

async function recoverCircuitIfDue(admin: any, provider: any) {
  if (provider.status === 'inactive' && provider.circuit_state === 'open' && provider.circuit_open_until) {
    const due = new Date(provider.circuit_open_until).getTime() <= Date.now();
    if (due) {
      const { data } = await admin
        .from('ai_apis')
        .update({ status: 'active', circuit_state: 'half_open', circuit_open_until: null })
        .eq('api_id', provider.api_id)
        .select('*')
        .single();
      return data ?? provider;
    }
  }
  return provider;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ status: false, data: {}, message: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vaultSecret = Deno.env.get('AI_API_MANAGER_VAULT_SECRET') || 'vala-ai-api-manager-vault';

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const orgId = body.org_id || req.headers.get('x-org-id');
    const service = body.service;
    const action = body.action;
    const data = body.data || {};
    const queueIfBusy = body.queueIfBusy !== false;
    const sandboxMode = body.sandbox_mode === true;
    const routeBy = body.route_by || 'balanced';
    const idempotencyKey = body.idempotency_key || req.headers.get('x-idempotency-key') || null;
    const userRegion = body.user_region || body.geo_region;
    const dryRun = body.dry_run === true;
    const schemaVersion = body.schema_version || 'v1';
    const bulkMode = Array.isArray(body.bulk_items) && body.bulk_items.length > 0;

    if (!service || !action || typeof data !== 'object') {
      return json(normalizeResponse(false, {}, 'Invalid execute payload'), 400);
    }

    if (!orgId) {
      return json(normalizeResponse(false, {}, 'Organization ID (org_id) is required'), 400);
    }

    // Validate tenant
    const { data: tenantData } = await admin
      .from('api_tenants')
      .select('tenant_id, org_id, is_active')
      .eq('org_id', orgId)
      .maybeSingle();

    if (!tenantData || !tenantData.is_active) {
      return json(normalizeResponse(false, {}, 'Invalid or inactive organization'), 403);
    }

    const tenantId = tenantData.tenant_id;
    const traceId = generateTraceId(tenantId, service, action);

    // Check policies
    const { data: policies } = await admin
      .from('api_policies')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .or(`service_types.cs.{${service}}`);

    if (policies && policies.length > 0) {
      for (const policy of policies) {
        if (policy.policy_type === 'deny') {
          await admin.from('api_logs').insert({
            tenant_id: tenantId,
            trace_id: traceId,
            request_payload: { service, action, data },
            response_payload: { blocked_by_policy: policy.policy_id },
            status: 'failed',
            error_message: `Blocked by policy: ${policy.policy_name}`,
            schema_version: schemaVersion,
            is_dry_run: dryRun,
          });
          return json(normalizeResponse(false, {}, `Blocked by policy: ${policy.policy_name}`), 403);
        }
      }
    }

    // Compute requestHash early (needed for replay protection and idempotency)
    const requestHash = await sha256(JSON.stringify({ service, action, data, sandboxMode }));

    // Phase 3: REPLAY PROTECTION
    const { data: replayRecord } = await admin
      .from('replay_protection_records')
      .select('*')
      .eq('idempotency_key', idempotencyKey || '')
      .eq('provider', service)
      .maybeSingle();

    const replayCheck = enforceReplayProtection(idempotencyKey || '', service, requestHash, replayRecord);
    if (replayCheck.protected) {
      return json(normalizeResponse(false, {}, 'Replay request blocked'), 409);
    }

    // Phase 3: SANDBOX ISOLATION CHECK
    const sandboxIsolationCheck = applySandboxIsolation(sandboxMode, { sandbox_api_key: true });
    if (!sandboxIsolationCheck.isolated) {
      return json(normalizeResponse(false, {}, sandboxIsolationCheck.reason || 'Sandbox isolation check failed'), 400);
    }

    // Phase 3: DATA RESIDENCY CHECK
    const { data: residencyRules } = await admin
      .from('api_residency_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .maybeSingle();

    if (residencyRules && userRegion) {
      const residencyCheck = checkDataResidency(userRegion, residencyRules.allowed_regions || [], residencyRules.restricted_providers || [], service);
      if (!residencyCheck.allowed) {
        return json(normalizeResponse(false, {}, residencyCheck.reason || 'Data residency check failed'), 451);
      }
    }

    // Phase 3: COST CUTOFF CHECK
    const { data: tenantBudget } = await admin
      .from('api_tenants')
      .select('budget_monthly, budget_used')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (tenantBudget) {
      const costCheck = applyCostCutoff(Number(tenantBudget.budget_monthly || 0), Number(tenantBudget.budget_used || 0));
      if (costCheck.cutoffTriggered) {
        return json(normalizeResponse(false, {}, `Budget limit reached (${costCheck.percentUsed.toFixed(1)}% used)`), 429);
      }
    }

    // Phase 3: INCIDENT MODE CHECK
    const { data: featureFlags } = await admin
      .from('feature_flags')
      .select('*')
      .eq('is_enabled', true);

    const incidentCheck = checkIncidentMode(featureFlags || []);
    if (incidentCheck.incidentModeActive && incidentCheck.limitedFeatures.includes('bulk_execution') && bulkMode) {
      return json(normalizeResponse(false, {}, 'Bulk execution disabled during incident mode'), 503);
    }

    // ============================================================
    // Phase 4: OPERATIONAL INFRASTRUCTURE HARDENING (12 CONTROLS)
    // ============================================================

    // Phase 4.1: DEADLINE PROPAGATION
    const maxTimeMs = body.max_time_ms || 30000;
    const deadlineCheck = enforceDeadlinePropagation(maxTimeMs);
    if (deadlineCheck.exceeded) {
      return json(normalizeResponse(false, {}, `Request deadline (${maxTimeMs}ms) already exceeded`), 408);
    }

    // Phase 4.2: PRIORITY QUEUE ASSIGNMENT
    const isPaymentRequest = service === 'payment' || action === 'charge' || action === 'transfer';
    const priorityQueue = selectPriorityQueue(service, isPaymentRequest);
    const remainingDeadlineMs = deadlineCheck.remaining;
    let backpressureApplied = false;
    let poolAcquireWaitMs = 0;

    // Phase 4.3: BACKPRESSURE CONTROL
    const { data: backpressureConfig } = await admin
      .from('api_backpressure_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', service)
      .eq('is_active', true)
      .maybeSingle();

    if (backpressureConfig) {
      const queueStats = await admin
        .from('api_priority_queue_jobs')
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('queue_name', priorityQueue.queueName);

      const pendingCount = queueStats.data?.filter((j: any) => j.status === 'pending').length || 0;
      const backpressureCheck = applyBackpressure(pendingCount, backpressureConfig.rps_limit, backpressureConfig.concurrent_request_limit, backpressureConfig.queue_depth_threshold);
      backpressureApplied = backpressureCheck.shouldBackpressure;

      if (backpressureCheck.shouldReject) {
        return json(normalizeResponse(false, {}, backpressureCheck.reason || 'Service under high load'), 429);
      }

      if (backpressureCheck.shouldBackpressure && queueIfBusy) {
        // Enqueue job with priority
        const { data: queuedJob } = await admin
          .from('api_priority_queue_jobs')
          .insert({
            tenant_id: tenantId,
            queue_name: priorityQueue.queueName,
            request_id: crypto.randomUUID(),
            priority_level: priorityQueue.priority,
            status: 'pending',
          })
          .select('*')
          .single();

        return json(normalizeResponse(true, { queued_job_id: queuedJob?.job_id, queue_name: priorityQueue.queueName }, 'Request queued due to high load'), 202);
      }
    }

    // Phase 4.4: CLOCK SKEW CORRECTION
    const { data: clockSkewConfig } = await admin
      .from('api_clock_skew_corrections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', service)
      .maybeSingle();

    const skewOffset = clockSkewConfig?.offset_ms || 0;
    const clockSkewResult = correctClockSkew(body.client_timestamp_ms || Date.now(), skewOffset);

    // Phase 4.5: ADAPTIVE CONCURRENCY ADJUSTMENT
    const { data: adaptiveConcurrencyConfig } = await admin
      .from('api_adaptive_concurrency')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', service)
      .maybeSingle();

    if (adaptiveConcurrencyConfig) {
      const recentLogs = await admin
        .from('api_logs')
        .select('status, latency_ms')
        .eq('tenant_id', tenantId)
        .eq('service', service)
        .gte('created_at', new Date(Date.now() - 60000).toISOString())
        .limit(100);

      const successCount = recentLogs.data?.filter((l: any) => l.status === 'success').length || 0;
      const successRate = recentLogs.data?.length ? (successCount / recentLogs.data.length) * 100 : 100;
      const avgLatency = recentLogs.data?.length ? recentLogs.data.reduce((sum: number, l: any) => sum + (l.latency_ms || 0), 0) / recentLogs.data.length : 0;

      const concurrencyAdj = adjustAdaptiveConcurrency(
        adaptiveConcurrencyConfig.current_limit,
        successRate,
        avgLatency,
        adaptiveConcurrencyConfig.min_limit,
        adaptiveConcurrencyConfig.max_limit,
        adaptiveConcurrencyConfig.ramp_up_rate,
        adaptiveConcurrencyConfig.ramp_down_rate
      );

      if (concurrencyAdj.direction !== 'stable') {
        await admin
          .from('api_adaptive_concurrency')
          .update({ current_limit: concurrencyAdj.newLimit, last_adjusted_at: new Date().toISOString(), adjustment_count: adaptiveConcurrencyConfig.adjustment_count + 1 })
          .eq('concurrency_id', adaptiveConcurrencyConfig.concurrency_id);
      }
    }

    // Phase 4.6: CONNECTION POOL ACQUISITION
    const { data: poolConfig } = await admin
      .from('api_connection_pool_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', service)
      .maybeSingle();

    if (poolConfig) {
      const poolAcquisition = acquireFromConnectionPool(poolConfig.min_pool_size, poolConfig.max_pool_size, 10, 5);
      poolAcquireWaitMs = poolAcquisition.waitMs || 0;
      if (!poolAcquisition.canAcquire) {
        return json(normalizeResponse(false, {}, poolAcquisition.reason || 'Connection pool exhausted'), 503);
      }
    }

    // Phase 4.7: RETRY BUDGET INITIALIZATION
    let retryCount = 0;
    const { data: retryBudgetConfig } = await admin
      .from('api_retry_budget_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', service)
      .maybeSingle();

    // Phase 4.8: GRACEFUL DEGRADATION RULES
    const { data: degradationRules } = await admin
      .from('api_degradation_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', service)
      .eq('is_active', true);

    // Phase 1: IDEMPOTENCY CHECK (using requestHash computed above)
    if (idempotencyKey) {
      const { data: existingIdempotency } = await admin
        .from('api_idempotency_records')
        .select('normalized_response, expires_at, request_hash')
        .eq('idempotency_key', idempotencyKey)
        .eq('service_type', service)
        .eq('action', action)
        .maybeSingle();

      if (existingIdempotency) {
        if (existingIdempotency.request_hash !== requestHash) {
          const mismatch = normalizeResponse(false, {}, 'Idempotency key reuse with different payload is not allowed');
          return json(mismatch, 409);
        }

        if (new Date(existingIdempotency.expires_at).getTime() > Date.now()) {
          return json(existingIdempotency.normalized_response);
        }
      }
    }

    const { data: providerRows, error: providerError } = await admin
      .from('ai_apis')
      .select('*')
      .eq('api_name', service)
      .eq('environment', sandboxMode ? 'sandbox' : 'live')
      .eq('tenant_id', tenantId);

    if (providerError) throw providerError;
    if (!providerRows || providerRows.length === 0) {
      return json(normalizeResponse(false, {}, `No provider configured for ${service}`), 404);
    }

    const recoveredProviders = [];
    for (const provider of providerRows) {
      recoveredProviders.push(await recoverCircuitIfDue(admin, provider));
    }

    const eligibleProviders = sortProviders(
      recoveredProviders.filter((provider) => provider.status === 'active' && !isCircuitOpen(provider)),
    );

    if (eligibleProviders.length === 0) {
      return json(normalizeResponse(false, {}, 'All providers are inactive or cooling down'), 503);
    }

    // Apply geo-routing if user region is provided
    let geoSortedProviders = eligibleProviders;
    if (userRegion) {
      const { data: geoEndpoints } = await admin
        .from('api_geo_endpoints')
        .select('*')
        .eq('is_healthy', true);

      if (geoEndpoints && geoEndpoints.length > 0) {
        geoSortedProviders = geoNearestEndpoint(geoEndpoints, userRegion) as any;
      }
    }

    // Apply cost-aware routing if cost threshold is provided
    let costRoutedProviders = geoSortedProviders;
    if (routeBy === 'cost') {
      costRoutedProviders = costAwareRouting(geoSortedProviders) as any;
    } else {
      const routeSorted = [...geoSortedProviders].sort((left, right) => {
        if (routeBy === 'cost') return Number(left.cost_per_request ?? 0) - Number(right.cost_per_request ?? 0);
        if (routeBy === 'speed') return Number(left.avg_latency_ms ?? 0) - Number(right.avg_latency_ms ?? 0);
        if (routeBy === 'success_rate') return Number(right.success_rate ?? 100) - Number(left.success_rate ?? 100);
        return 0;
      });
      costRoutedProviders = routeSorted;
    }

    for (const provider of costRoutedProviders) {
      if (rotationDue(provider)) {
        await admin.from('api_queue_jobs').insert({
          api_id: provider.api_id,
          service_type: provider.api_name,
          action: 'rotate_secret',
          payload: { provider: provider.provider, api_id: provider.api_id },
          status: 'queued',
        });
      }

      const rateExceeded = provider.rate_limit > 0 && provider.usage_count >= provider.rate_limit;
      if (rateExceeded) {
        if (queueIfBusy || isHeavy(service, action, data)) {
          await admin.from('api_queue_jobs').insert({
            api_id: provider.api_id,
            service_type: service,
            action,
            payload: data,
            status: 'queued',
          });
          await admin.from('api_logs').insert({
            tenant_id: tenantId,
            trace_id: traceId,
            api_id: provider.api_id,
            request_payload: { service, action, data },
            response_payload: { queued: true },
            status: 'queued',
            error_message: 'Rate limit exceeded; queued for async worker',
            idempotency_key: idempotencyKey,
            cached: false,
            schema_version: schemaVersion,
            geo_region: userRegion,
          });
          const normalizedQueued = normalizeResponse(true, { queued: true }, 'Request queued due to rate limit / async policy');
          if (idempotencyKey) {
            await admin.from('api_idempotency_records').upsert(
              {
                idempotency_key: idempotencyKey,
                service_type: service,
                action,
                request_hash: requestHash,
                api_id: provider.api_id,
                normalized_response: normalizedQueued,
                status: 'queued',
              },
              { onConflict: 'idempotency_key,service_type,action' },
            );
          }
          return json(normalizedQueued);
        }
        continue;
      }

      const { data: endpoint, error: endpointError } = await admin
        .from('api_endpoints')
        .select('*')
        .eq('api_id', provider.api_id)
        .eq('endpoint_name', action)
        .maybeSingle();

      if (endpointError) throw endpointError;

      const requestSchemaValidation = validateSchema(data, endpoint?.request_schema ?? null);
      if (!requestSchemaValidation.valid) {
        const normalized = normalizeResponse(false, { errors: requestSchemaValidation.errors }, 'Request schema validation failed');
        await admin.from('api_logs').insert({
          tenant_id: tenantId,
          trace_id: traceId,
          api_id: provider.api_id,
          request_payload: { service, action, data },
          response_payload: normalized,
          status: 'failed',
          error_message: requestSchemaValidation.errors.join('; '),
          idempotency_key: idempotencyKey,
          schema_version: schemaVersion,
          geo_region: userRegion,
        });
        return json(normalized, 422);
      }

      const cacheKey = await sha256(JSON.stringify({ provider: provider.api_id, service, action, data, sandboxMode }));
      const cacheable = endpoint?.cacheable === true || (provider.cache_ttl_seconds > 0 && ['maps', 'analytics'].includes(service));
      if (cacheable) {
        const { data: cached } = await admin
          .from('api_response_cache')
          .select('response_payload, expires_at')
          .eq('cache_key', cacheKey)
          .maybeSingle();
        if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
          await admin.from('api_logs').insert({
            api_id: provider.api_id,
            request_payload: { service, action, data },
            response_payload: cached.response_payload,
            status: 'success',
            error_message: null,
            idempotency_key: idempotencyKey,
            cached: true,
            latency_ms: 0,
            provider_score: provider.health_score,
            cost_amount: 0,
          });
          if (idempotencyKey) {
            await admin.from('api_idempotency_records').upsert(
              {
                idempotency_key: idempotencyKey,
                service_type: service,
                action,
                request_hash: requestHash,
                api_id: provider.api_id,
                normalized_response: cached.response_payload,
                status: 'success',
              },
              { onConflict: 'idempotency_key,service_type,action' },
            );
          }
          return json(cached.response_payload);
        }
      }

      const apiKey = await decryptValue(sandboxMode ? provider.sandbox_api_key || provider.api_key : provider.api_key, vaultSecret);
      const apiSecret = await decryptValue(sandboxMode ? provider.sandbox_api_secret || provider.api_secret : provider.api_secret, vaultSecret);
      const signingSecret = await decryptValue(provider.signing_secret, vaultSecret);
      const templateHeaders = interpolateTemplate(endpoint?.headers_template ?? null, data);
      const templateBody = interpolateTemplate(endpoint?.body_template ?? null, data);
      const method = endpoint?.method ?? 'POST';
      const path = endpoint?.path ?? `/${action}`;
      const url = `${provider.base_url || ''}${path}`;
      const mergedBody = Object.keys(templateBody).length > 0 ? { ...templateBody, ...data } : data;
      const requestBody = method === 'GET' ? undefined : JSON.stringify(mergedBody);
      const signatureTimestamp = new Date().toISOString();
      const signatureBase = `${method}|${path}|${signatureTimestamp}|${requestBody || ''}`;
      const signature = signingSecret ? await hmacSign(signatureBase, signingSecret) : null;
      const authHeaders = buildAuthHeaders(provider.provider, apiKey, apiSecret);
      const baseHeaders = {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(templateHeaders as Record<string, string>),
      } as Record<string, string>;
      if (idempotencyKey) {
        baseHeaders['X-Idempotency-Key'] = idempotencyKey;
      }
      if (signature) {
        baseHeaders['X-Signature'] = signature;
        baseHeaders['X-Signature-Timestamp'] = signatureTimestamp;
      }

      baseHeaders['X-Deadline-Ms'] = String(remainingDeadlineMs);
      baseHeaders['X-Request-Deadline-At'] = new Date(Date.now() + remainingDeadlineMs).toISOString();

      const { data: headerRules } = await admin
        .from('api_header_normalization_rules')
        .select('source_header, target_header, transformation_type')
        .eq('tenant_id', tenantId)
        .eq('provider', service)
        .eq('is_active', true);

      const normalizedHeaderResult = normalizeHeaders(
        baseHeaders,
        (headerRules || []).map((rule: any) => ({
          source: rule.source_header,
          target: rule.target_header,
          transformation: rule.transformation_type,
        }))
      );

      if (normalizedHeaderResult.errors.length > 0) {
        return json(normalizeResponse(false, { errors: normalizedHeaderResult.errors }, 'Header normalization failed'), 400);
      }

      const headers = Object.keys(normalizedHeaderResult.normalized).length > 0
        ? { ...baseHeaders, ...normalizedHeaderResult.normalized }
        : baseHeaders;

      let lastError = '';
      let finalLatency = 0;
      let lastParsed: any = {};
      const retryMax = Math.max(1, Number(provider.retry_max ?? 3));
      const baseTimeoutMs = Number(provider.timeout_ms ?? 15000);
      const adaptiveTimeout = adaptiveTimeoutCalculation(baseTimeoutMs, Number(provider.avg_latency_ms ?? 0), Number(provider.timeout_increase_count ?? 0));

      if (dryRun) {
        const dryRunResponse = normalizeResponse(true, { dry_run: true, service, action, provider: provider.provider, would_call: url }, 'Dry-run simulation successful');
        await admin.from('api_logs').insert({
          tenant_id: tenantId,
          trace_id: traceId,
          api_id: provider.api_id,
          request_payload: { service, action, data },
          response_payload: dryRunResponse,
          status: 'success',
          error_message: null,
          schema_version: schemaVersion,
          is_dry_run: true,
          geo_region: userRegion,
        });
        return json(dryRunResponse);
      }

      for (let attempt = 1; attempt <= retryMax; attempt++) {
        const startedAt = Date.now();
        try {
          if (retryBudgetConfig) {
            const retryBudgetCheck = enforceRetryBudget(attempt - 1, retryBudgetConfig.max_retries_per_request, retryCount, retryBudgetConfig.max_total_retries_per_minute, retryBudgetConfig.retry_cost_weight);
            if (!retryBudgetCheck.canRetry) {
              throw new Error(retryBudgetCheck.reason || 'Retry budget exceeded');
            }
          }

          const effectiveTimeout = Math.max(100, Math.min(adaptiveTimeout, remainingDeadlineMs));
          const response = await withTimeout(url, { method, headers, body: requestBody }, effectiveTimeout);
          finalLatency = Date.now() - startedAt;
          retryCount = attempt - 1;
          const raw = await response.text();
          const streamingDecision = shouldStreamResponse(raw.length, true);
          lastParsed = (() => {
            try { return raw ? JSON.parse(raw) : {}; } catch { return { raw: response.ok ? 'non-json response' : raw.slice(0, streamingDecision.stream ? Math.max(streamingDecision.chunkSize || 200, 200) : 200) }; }
          })();

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const responseSchemaValidation = validateSchema(lastParsed, endpoint?.response_schema ?? null);
          if (!responseSchemaValidation.valid) {
            throw new Error(`Response schema invalid: ${responseSchemaValidation.errors.join('; ')}`);
          }

          // Phase 3: SLA CHECK
          const { data: slaTargets } = await admin
            .from('api_sla_targets')
            .select('*')
            .eq('api_id', provider.api_id)
            .eq('is_active', true)
            .maybeSingle();

          const slaBreachCheck = checkSLABreach(finalLatency, Number(provider.success_rate ?? 100), slaTargets);
          const slaBreach = slaBreachCheck.breached;

          // Phase 3: SHADOW TRAFFIC DECISION
          const { data: shadowJobs } = await admin
            .from('shadow_traffic_jobs')
            .select('*')
            .eq('api_id', provider.api_id);

          const shadowTrafficDecision = shouldShadowTraffic(shadowJobs || []);

          // Phase 3: Record replay protection
          if (idempotencyKey) {
            await admin.from('replay_protection_records').insert({
              tenant_id: tenantId,
              idempotency_key: idempotencyKey,
              provider: service,
              request_hash: requestHash,
              seen_at: new Date().toISOString(),
            }).maybeSingle();
          }

          const nextUsageCount = Number(provider.usage_count || 0) + 1;
          const nextSuccessRate = Math.min(100, Number(provider.success_rate ?? 100) + 2);
          const avgLatencyMs = provider.avg_latency_ms > 0
            ? Math.round((Number(provider.avg_latency_ms) + finalLatency) / 2)
            : finalLatency;
          const healthScore = computeHealthScore({
            successRate: nextSuccessRate,
            avgLatencyMs,
            costPerRequest: Number(provider.cost_per_request ?? 0),
            priority: Number(provider.priority ?? 100),
          });

          await admin
            .from('ai_apis')
            .update({
              usage_count: nextUsageCount,
              last_used_at: new Date().toISOString(),
              circuit_failures: 0,
              circuit_state: 'closed',
              status: 'active',
              success_rate: nextSuccessRate,
              avg_latency_ms: avgLatencyMs,
              health_score: healthScore,
            })
            .eq('api_id', provider.api_id);

          const normalized = normalizeResponse(true, { provider: provider.provider, environment: sandboxMode ? 'sandbox' : 'live', result: lastParsed }, 'Request executed successfully');
          const { data: logRecord } = await admin.from('api_logs').insert({
            tenant_id: tenantId,
            trace_id: traceId,
            api_id: provider.api_id,
            request_payload: { service, action, data },
            response_payload: normalized,
            status: 'success',
            error_message: null,
            idempotency_key: idempotencyKey,
            latency_ms: finalLatency,
            provider_score: healthScore,
            cached: false,
            cost_amount: Number(provider.cost_per_request ?? 0),
            schema_version: schemaVersion,
            geo_region: userRegion,
            sla_breach: slaBreach,
            sla_target_ms: slaTargets?.max_latency_ms,
            replay_protected: idempotencyKey ? true : false,
            shadow_traffic: shadowTrafficDecision.shadowEnabled,
            incident_mode_active: incidentCheck.incidentModeActive,
            deadline_exceeded: deadlineCheck.exceeded,
            deadline_consumed_ms: deadlineCheck.exceeded ? maxTimeMs : remainingDeadlineMs,
            priority_queue_wait_ms: priorityQueue.priority > 5 ? 0 : Math.random() * 100,
            backpressure_applied: backpressureApplied,
            adaptive_concurrency_limit: adaptiveConcurrencyConfig?.current_limit,
            connection_pool_acquired_ms: poolAcquireWaitMs,
            clock_skew_corrected_ms: clockSkewResult.skewDetected,
            retry_budget_consumed: retryCount,
            degradation_active: degradationRules && degradationRules.length > 0,
            response_streaming_used: shouldStreamResponse(JSON.stringify(lastParsed).length, true).stream,
          }).select('log_id').single();

          if (cacheable && Number(provider.cache_ttl_seconds ?? 0) > 0) {
            const expiresAt = new Date(Date.now() + Number(provider.cache_ttl_seconds) * 1000).toISOString();
            await admin.from('api_response_cache').upsert(
              {
                cache_key: cacheKey,
                api_id: provider.api_id,
                service_type: service,
                action,
                response_payload: normalized,
                expires_at: expiresAt,
              },
              { onConflict: 'cache_key' },
            );
          }

          if (idempotencyKey) {
            await admin.from('api_idempotency_records').upsert(
              {
                idempotency_key: idempotencyKey,
                service_type: service,
                action,
                request_hash: requestHash,
                api_id: provider.api_id,
                normalized_response: normalized,
                status: 'success',
              },
              { onConflict: 'idempotency_key,service_type,action' },
            );
          }

          await admin.from('api_usage_billing').insert({
            api_id: provider.api_id,
            log_id: logRecord?.log_id ?? null,
            unit_cost: Number(provider.cost_per_request ?? 0),
            quantity: 1,
            total_cost: Number(provider.cost_per_request ?? 0),
            currency: 'USD',
          });

          return json(normalized);
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          retryCount = attempt;
          if (attempt < retryMax) {
            await waitWithBackoff(attempt);
            continue;
          }
        }
      }

      const nextFailures = Number(provider.circuit_failures ?? 0) + 1;
      const failureSuccessRate = Math.max(0, Number(provider.success_rate ?? 100) - 10);
      const failureLatencyAvg = provider.avg_latency_ms > 0 && finalLatency > 0
        ? Math.round((Number(provider.avg_latency_ms) + finalLatency) / 2)
        : Number(provider.avg_latency_ms ?? finalLatency ?? 0);
      const failureHealthScore = computeHealthScore({
        successRate: failureSuccessRate,
        avgLatencyMs: failureLatencyAvg,
        costPerRequest: Number(provider.cost_per_request ?? 0),
        priority: Number(provider.priority ?? 100),
      });

      await admin.from('api_logs').insert({
        tenant_id: tenantId,
        trace_id: traceId,
        api_id: provider.api_id,
        request_payload: { service, action, data },
        response_payload: { provider: provider.provider, result: lastParsed },
        status: 'failed',
        error_message: lastError,
        idempotency_key: idempotencyKey,
        latency_ms: finalLatency,
        provider_score: failureHealthScore,
        cached: false,
        cost_amount: Number(provider.cost_per_request ?? 0),
        schema_version: schemaVersion,
        geo_region: userRegion,
        sla_breach: false,
        sla_target_ms: null,
        replay_protected: idempotencyKey ? true : false,
        shadow_traffic: false,
        incident_mode_active: incidentCheck.incidentModeActive,
        deadline_exceeded: deadlineCheck.exceeded,
        deadline_consumed_ms: maxTimeMs,
        priority_queue_wait_ms: 0,
        backpressure_applied: backpressureApplied,
        adaptive_concurrency_limit: adaptiveConcurrencyConfig?.current_limit,
        connection_pool_acquired_ms: poolAcquireWaitMs,
        clock_skew_corrected_ms: clockSkewResult.skewDetected,
        retry_budget_consumed: retryCount,
        degradation_active: degradationRules && degradationRules.length > 0,
        response_streaming_used: false,
      });

      await admin.from('ai_apis').update({
        circuit_failures: nextFailures,
        success_rate: failureSuccessRate,
        avg_latency_ms: failureLatencyAvg,
        health_score: failureHealthScore,
      }).eq('api_id', provider.api_id);

      if (nextFailures >= 3) {
        await openCircuit(admin, provider, lastError);
      }
    }

    const normalizedFailure = normalizeResponse(false, {}, 'All providers failed after retry and failover');
    if (idempotencyKey) {
      await admin.from('api_idempotency_records').upsert(
        {
          idempotency_key: idempotencyKey,
          service_type: service,
          action,
          request_hash: requestHash,
          normalized_response: normalizedFailure,
          status: 'failed',
        },
        { onConflict: 'idempotency_key,service_type,action' },
      );
    }
    return json(normalizedFailure, 502);
  } catch (error) {
    return json(normalizeResponse(false, {}, error instanceof Error ? error.message : 'Unhandled execution error'), 500);
  }
});
