import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptValue, maskValue, rotationDue } from "../_shared/ai-api-core.ts";

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

function toPublicRecord(row: any) {
  return {
    ...row,
    usage_limit: row?.rate_limit ?? 0,
  };
}

function normalizeRegisterPayload(payload: any) {
  const normalizedApiKey =
    payload?.api_key ??
    payload?.account_sid ??
    payload?.access_key ??
    payload?.server_key ??
    payload?.tracking_id ??
    payload?.client_id ??
    payload?.token ??
    null;

  const normalizedApiSecret =
    payload?.api_secret ??
    payload?.secret_key ??
    payload?.auth_token ??
    payload?.client_secret ??
    null;

  const normalizedSandboxApiKey =
    payload?.sandbox_api_key ??
    payload?.sandbox_account_sid ??
    payload?.sandbox_access_key ??
    null;

  const normalizedSandboxApiSecret =
    payload?.sandbox_api_secret ??
    payload?.sandbox_secret_key ??
    payload?.sandbox_auth_token ??
    payload?.sandbox_client_secret ??
    null;

  return {
    api_key: normalizedApiKey,
    api_secret: normalizedApiSecret,
    sandbox_api_key: normalizedSandboxApiKey,
    sandbox_api_secret: normalizedSandboxApiSecret,
    usage_limit: Number(payload?.usage_limit ?? payload?.rate_limit ?? 0),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vaultSecret = Deno.env.get('AI_API_MANAGER_VAULT_SECRET') || 'vala-ai-api-manager-vault';

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { action, payload } = await req.json();
    const orgId = payload?.org_id || req.headers.get('x-org-id');

    // Phase 2: Tenant management actions
    if (action === 'tenant_register') {
      if (!payload?.org_id || !payload?.org_name) {
        return json({ error: 'org_id and org_name are required' }, 400);
      }

      const { data: existingTenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', payload.org_id)
        .maybeSingle();

      if (existingTenant) {
        return json({ error: 'Organization already registered' }, 409);
      }

      const { data: newTenant, error: tenantError } = await admin
        .from('api_tenants')
        .insert({
          org_id: payload.org_id,
          org_name: payload.org_name,
          isolation_level: payload.isolation_level || 'isolated',
          budget_monthly: payload.budget_monthly || 0,
          cost_alert_threshold: payload.cost_alert_threshold,
          is_active: true,
        })
        .select('*')
        .single();

      if (tenantError) throw tenantError;
      return json({ item: newTenant });
    }

    if (action === 'tenant_list') {
      const { data, error } = await admin.from('api_tenants').select('*').eq('is_active', true);
      if (error) throw error;
      return json({ items: data ?? [] });
    }

    if (action === 'policy_create') {
      if (!orgId) return json({ error: 'org_id required' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const { data: policy, error: policyError } = await admin
        .from('api_policies')
        .insert({
          tenant_id: tenant.tenant_id,
          api_id: payload.api_id || null,
          policy_name: payload.policy_name,
          policy_type: payload.policy_type,
          conditions: payload.conditions || {},
          service_types: payload.service_types || [],
          is_active: true,
        })
        .select('*')
        .single();

      if (policyError) throw policyError;
      return json({ item: policy });
    }

    if (action === 'list') {
      if (!orgId) return json({ error: 'org_id required' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const { data, error } = await admin
        .from('ai_apis')
        .select('api_id, api_name, provider, base_url, status, rate_limit, usage_count, last_used_at, created_at, priority, timeout_ms, retry_max, circuit_state, success_rate, avg_latency_ms, health_score, cost_per_request, environment, cache_ttl_seconds, last_rotated_at, rotate_after_days, geo_region, tenant_id')
        .eq('tenant_id', tenant.tenant_id)
        .order('api_name', { ascending: true })
        .order('priority', { ascending: true });

      if (error) throw error;
      return json({ items: (data ?? []).map((item: any) => toPublicRecord(item)) });
    }

    if (action === 'register') {
      if (!orgId) return json({ error: 'org_id required to register API' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const normalized = normalizeRegisterPayload(payload);
      if (!normalized.api_key) {
        return json({ error: 'Missing required key: api_key / account_sid / access_key / server_key / tracking_id / client_id / token' }, 400);
      }

      const apiKeyEncrypted = await encryptValue(normalized.api_key, vaultSecret);
      const apiSecretEncrypted = normalized.api_secret ? await encryptValue(normalized.api_secret, vaultSecret) : null;
      const sandboxApiKeyEncrypted = normalized.sandbox_api_key ? await encryptValue(normalized.sandbox_api_key, vaultSecret) : null;
      const sandboxApiSecretEncrypted = normalized.sandbox_api_secret ? await encryptValue(normalized.sandbox_api_secret, vaultSecret) : null;
      const signingSecretEncrypted = payload.signing_secret ? await encryptValue(payload.signing_secret, vaultSecret) : null;

      const { data: inserted, error: insertError } = await admin
        .from('ai_apis')
        .insert({
          tenant_id: tenant.tenant_id,
          api_name: payload.api_name,
          provider: payload.provider,
          api_key: apiKeyEncrypted,
          api_secret: apiSecretEncrypted,
          base_url: payload.base_url,
          status: 'active',
          rate_limit: normalized.usage_limit,
          usage_count: 0,
          priority: payload.priority ?? 100,
          timeout_ms: payload.timeout_ms ?? 15000,
          retry_max: payload.retry_max ?? 3,
          cost_per_request: payload.cost_per_request ?? 0,
          environment: payload.environment ?? 'live',
          sandbox_api_key: sandboxApiKeyEncrypted,
          sandbox_api_secret: sandboxApiSecretEncrypted,
          signing_secret: signingSecretEncrypted,
          cache_ttl_seconds: payload.cache_ttl_seconds ?? 0,
          rotate_after_days: payload.rotate_after_days ?? 90,
          last_rotated_at: new Date().toISOString(),
          geo_region: payload.geo_region,
          cost_per_1k_requests: payload.cost_per_1k_requests ?? 0,
        })
        .select('api_id, api_name, provider, base_url, status, rate_limit, usage_count, last_used_at, created_at, priority, timeout_ms, retry_max, circuit_state, success_rate, avg_latency_ms, health_score, cost_per_request, environment, cache_ttl_seconds, last_rotated_at, rotate_after_days, geo_region, tenant_id')
        .single();

      if (insertError) throw insertError;

      if (Array.isArray(payload.endpoints) && payload.endpoints.length > 0) {
        const endpointRows = payload.endpoints.map((endpoint: any) => ({
          api_id: inserted.api_id,
          endpoint_name: endpoint.endpoint_name,
          method: endpoint.method,
          path: endpoint.path,
          headers_template: endpoint.headers_template ?? null,
          body_template: endpoint.body_template ?? null,
          request_schema: endpoint.request_schema ?? null,
          response_schema: endpoint.response_schema ?? null,
          cacheable: endpoint.cacheable ?? false,
        }));

        const { error: endpointError } = await admin.from('api_endpoints').insert(endpointRows);
        if (endpointError) throw endpointError;
      }

      return json({
        item: {
          ...toPublicRecord(inserted),
          api_key_masked: maskValue(normalized.api_key),
          api_secret_masked: maskValue(normalized.api_secret),
          sandbox_api_key_masked: maskValue(normalized.sandbox_api_key),
          sandbox_api_secret_masked: maskValue(normalized.sandbox_api_secret),
          signing_secret_masked: maskValue(payload.signing_secret),
        },
      });
    }

    if (action === 'toggle') {
      const { data, error } = await admin
        .from('ai_apis')
        .update({ status: payload.status })
        .eq('api_id', payload.api_id)
        .select('api_id, api_name, provider, base_url, status, rate_limit, usage_count, last_used_at, created_at, priority, timeout_ms, retry_max, circuit_state, success_rate, avg_latency_ms, health_score, cost_per_request, environment, cache_ttl_seconds, last_rotated_at, rotate_after_days')
        .single();

      if (error) throw error;
      return json({ item: toPublicRecord(data) });
    }

    if (action === 'rotate') {
      const updates: Record<string, unknown> = {
        last_rotated_at: new Date().toISOString(),
      };
      if (payload.api_key) updates.api_key = await encryptValue(payload.api_key, vaultSecret);
      if (payload.api_secret) updates.api_secret = await encryptValue(payload.api_secret, vaultSecret);
      if (payload.sandbox_api_key) updates.sandbox_api_key = await encryptValue(payload.sandbox_api_key, vaultSecret);
      if (payload.sandbox_api_secret) updates.sandbox_api_secret = await encryptValue(payload.sandbox_api_secret, vaultSecret);
      if (payload.signing_secret) updates.signing_secret = await encryptValue(payload.signing_secret, vaultSecret);

      const { data, error } = await admin
        .from('ai_apis')
        .update(updates)
        .eq('api_id', payload.api_id)
        .select('api_id, api_name, provider, base_url, status, rate_limit, usage_count, last_used_at, created_at, priority, timeout_ms, retry_max, circuit_state, success_rate, avg_latency_ms, health_score, cost_per_request, environment, cache_ttl_seconds, last_rotated_at, rotate_after_days')
        .single();

      if (error) throw error;
      return json({ item: toPublicRecord(data) });
    }

    if (action === 'monitor') {
      const query = admin
        .from('api_logs')
        .select('log_id, api_id, request_payload, response_payload, status, error_message, timestamp, latency_ms, provider_score, cost_amount, cached')
        .order('timestamp', { ascending: false })
        .limit(200);

      const { data, error } = payload?.service
        ? await query.contains('request_payload', { service: payload.service })
        : await query;

      if (error) throw error;

      const logs = data ?? [];
      const totalCalls = logs.length;
      const failedCalls = logs.filter((log: any) => log.status === 'failed').length;
      const failureRate = totalCalls === 0 ? 0 : Number(((failedCalls / totalCalls) * 100).toFixed(2));
      const latencies = logs
        .map((log: any) => Number(log.latency_ms || log.response_payload?.latency_ms || 0))
        .filter((value: number) => Number.isFinite(value) && value > 0);
      const avgLatencyMs = latencies.length === 0 ? 0 : Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length);
      const recentCalls = logs.filter((log: any) => Date.now() - new Date(log.timestamp).getTime() <= 15 * 60 * 1000).length;
      const usageSpikeDetected = recentCalls >= 25;
      const totalCost = Number(logs.reduce((sum: number, log: any) => sum + Number(log.cost_amount || 0), 0).toFixed(6));
      const cachedResponses = logs.filter((log: any) => log.cached === true).length;

      let recommendedAction = 'stable';
      if (failureRate >= 20) recommendedAction = 'switch_provider';
      else if (avgLatencyMs >= 1800) recommendedAction = 'alert_admin';
      else if (usageSpikeDetected) recommendedAction = 'optimize_usage';

      return json({
        snapshot: {
          totalCalls,
          failedCalls,
          failureRate,
          avgLatencyMs,
          usageSpikeDetected,
          recommendedAction,
          totalCost,
          cachedResponses,
        },
      });
    }

    if (action === 'rotation_sweep') {
      const environment = payload?.environment;
      const providerFilter = payload?.provider;

      let query = admin
        .from('ai_apis')
        .select('api_id, api_name, provider, status, environment, last_rotated_at, rotate_after_days')
        .eq('status', 'active');

      if (environment) query = query.eq('environment', environment);
      if (providerFilter) query = query.eq('provider', providerFilter);

      const { data: providers, error } = await query;
      if (error) throw error;

      const dueProviders = (providers ?? []).filter((provider: any) => rotationDue(provider));
      if (dueProviders.length > 0) {
        const jobs = dueProviders.map((provider: any) => ({
          api_id: provider.api_id,
          service_type: provider.api_name,
          action: 'rotate_secret',
          payload: {
            provider: provider.provider,
            api_id: provider.api_id,
            environment: provider.environment,
            rotate_after_days: provider.rotate_after_days,
          },
          status: 'queued',
        }));
        const { error: queueError } = await admin.from('api_queue_jobs').insert(jobs);
        if (queueError) throw queueError;
      }

      return json({
        scanned: providers?.length ?? 0,
        queued: dueProviders.length,
      });
    }

    // Phase 4: OPERATIONAL INFRASTRUCTURE ADMIN ACTIONS
    
    // 4.1: Priority Queue Configuration
    if (action === 'phase4_priority_queue_config') {
      if (!orgId) return json({ error: 'org_id required' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const { data: config, error } = await admin
        .from('api_priority_queue_config')
        .upsert({
          tenant_id: tenant.tenant_id,
          queue_name: payload.queue_name || 'default_normal',
          priority_level: payload.priority_level || 5,
          concurrency_limit: payload.concurrency_limit || 10,
          max_queue_depth: payload.max_queue_depth || 1000,
          timeout_ms: payload.timeout_ms || 30000,
          retry_limit: payload.retry_limit || 3,
          is_active: payload.is_active !== false,
        }, { onConflict: 'queue_name' })
        .select('*')
        .single();

      if (error) throw error;
      return json({ item: config });
    }

    // 4.2: Backpressure Control Configuration
    if (action === 'phase4_backpressure_config') {
      if (!orgId) return json({ error: 'org_id required' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const { data: config, error } = await admin
        .from('api_backpressure_config')
        .upsert({
          tenant_id: tenant.tenant_id,
          provider: payload.provider,
          rps_limit: payload.rps_limit || 100,
          concurrent_request_limit: payload.concurrent_request_limit || 50,
          queue_depth_threshold: payload.queue_depth_threshold || 500,
          load_shed_strategy: payload.load_shed_strategy || 'fifo',
          backpressure_timeout_ms: payload.backpressure_timeout_ms || 5000,
          is_active: payload.is_active !== false,
        }, { onConflict: 'provider' })
        .select('*')
        .single();

      if (error) throw error;
      return json({ item: config });
    }

    // 4.3: Adaptive Concurrency Tuning
    if (action === 'phase4_adaptive_concurrency_config') {
      if (!orgId) return json({ error: 'org_id required' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const { data: config, error } = await admin
        .from('api_adaptive_concurrency')
        .upsert({
          tenant_id: tenant.tenant_id,
          provider: payload.provider,
          current_limit: payload.current_limit || 10,
          min_limit: payload.min_limit || 2,
          max_limit: payload.max_limit || 100,
          ramp_up_rate: payload.ramp_up_rate || 1.1,
          ramp_down_rate: payload.ramp_down_rate || 0.9,
          success_rate_threshold: payload.success_rate_threshold || 90.0,
          latency_threshold_ms: payload.latency_threshold_ms || 1000,
        }, { onConflict: 'provider' })
        .select('*')
        .single();

      if (error) throw error;
      return json({ item: config });
    }

    // 4.4: TLS Pinning Management
    if (action === 'phase4_tls_pin_add') {
      if (!orgId) return json({ error: 'org_id required' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const { data: pin, error } = await admin
        .from('api_tls_pinning_config')
        .upsert({
          tenant_id: tenant.tenant_id,
          provider: payload.provider,
          certificate_sha256_fingerprint: payload.certificate_sha256_fingerprint,
          issuer_name: payload.issuer_name,
          subject_name: payload.subject_name,
          valid_until: payload.valid_until,
          is_active: payload.is_active !== false,
          pinning_mode: payload.pinning_mode || 'certificate',
          backup_fingerprint: payload.backup_fingerprint,
        }, { onConflict: 'provider' })
        .select('*')
        .single();

      if (error) throw error;
      return json({ item: pin });
    }

    // 4.5: Clock Skew Correction
    if (action === 'phase4_clock_skew_set') {
      if (!orgId) return json({ error: 'org_id required' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const { data: skewConfig, error } = await admin
        .from('api_clock_skew_corrections')
        .upsert({
          tenant_id: tenant.tenant_id,
          provider: payload.provider,
          offset_ms: payload.offset_ms || 0,
          auto_correct: payload.auto_correct !== false,
          max_auto_correction_ms: payload.max_auto_correction_ms || 5000,
        }, { onConflict: 'provider' })
        .select('*')
        .single();

      if (error) throw error;
      return json({ item: skewConfig });
    }

    // 4.6: Graceful Degradation Rules
    if (action === 'phase4_degradation_rule_set') {
      if (!orgId) return json({ error: 'org_id required' }, 400);

      const { data: tenant } = await admin
        .from('api_tenants')
        .select('tenant_id')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!tenant) return json({ error: 'Organization not found' }, 404);

      const { data: rule, error } = await admin
        .from('api_degradation_rules')
        .upsert({
          tenant_id: tenant.tenant_id,
          provider: payload.provider,
          service_component: payload.service_component,
          criticality_level: payload.criticality_level || 'non_critical',
          action_on_failure: payload.action_on_failure || 'continue',
          fallback_provider: payload.fallback_provider,
          fallback_timeout_ms: payload.fallback_timeout_ms || 5000,
          alert_on_failure: payload.alert_on_failure || false,
          max_consecutive_failures: payload.max_consecutive_failures || 10,
          recovery_strategy: payload.recovery_strategy || 'exponential',
          is_active: payload.is_active !== false,
        }, { onConflict: 'service_component' })
        .select('*')
        .single();

      if (error) throw error;
      return json({ item: rule });
    }

    return json({ error: 'Unsupported action' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
