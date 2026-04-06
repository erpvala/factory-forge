-- AI API Manager Phase 3: Production Chaos Mitigation
-- Zero-downtime rotation + replay protection + contract testing + SLA enforcement + residency + incident control

-- 1. ZERO-DOWNTIME KEY ROTATION
CREATE TABLE IF NOT EXISTS api_key_staging (
  staging_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID NOT NULL REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  new_api_key JSONB NOT NULL,
  new_api_secret JSONB,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'failed')),
  ready_to_activate BOOLEAN NOT NULL DEFAULT false,
  scheduled_activation_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  old_key_backout BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. REQUEST REPLAY PROTECTION
CREATE TABLE IF NOT EXISTS replay_protection_records (
  record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  webhook_id TEXT,
  provider TEXT,
  request_hash TEXT NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE (idempotency_key, provider)
);

-- 3. PROVIDER CONTRACT TESTING
CREATE TABLE IF NOT EXISTS api_contract_tests (
  test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID NOT NULL REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  endpoint_name TEXT NOT NULL,
  test_payload JSONB NOT NULL,
  expected_response_schema JSONB,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT CHECK (last_test_status IN ('pass', 'fail', 'degraded', NULL)),
  last_test_error TEXT,
  test_frequency_hours INTEGER NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4-5. SLA ENFORCER + LATENCY BUDGET
CREATE TABLE IF NOT EXISTS api_sla_targets (
  sla_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  service_type TEXT,
  action TEXT,
  max_latency_ms INTEGER NOT NULL DEFAULT 5000,
  min_success_rate NUMERIC(5,2) NOT NULL DEFAULT 99.0,
  max_error_rate NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  enforcement_mode TEXT NOT NULL DEFAULT 'enforce' CHECK (enforcement_mode IN ('alert', 'enforce', 'disabled')),
  enforcement_action TEXT CHECK (enforcement_action IN ('fallback', 'queue', 'reject')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. WEBHOOK RETRY + DLQ (DEAD-LETTER QUEUE)
CREATE TABLE IF NOT EXISTS webhook_dlq (
  dlq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES api_webhook_events(webhook_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_reason TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. DATA RESIDENCY CONTROL
CREATE TABLE IF NOT EXISTS api_residency_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  allowed_regions TEXT[] NOT NULL,
  restricted_providers TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. SHADOW TRAFFIC TESTING
CREATE TABLE IF NOT EXISTS shadow_traffic_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID NOT NULL REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  shadow_provider_id UUID REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  traffic_percentage INTEGER NOT NULL DEFAULT 10 CHECK (traffic_percentage > 0 AND traffic_percentage <= 100),
  test_duration_minutes INTEGER NOT NULL DEFAULT 60,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  results JSONB,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. POLICY VERSION CONTROL
CREATE TABLE IF NOT EXISTS policy_versions (
  version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES api_policies(policy_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  conditions JSONB NOT NULL,
  service_types TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  rollback_from_version INTEGER,
  UNIQUE (policy_id, version_number)
);

-- 12. INCIDENT MODE (Global feature flags)
CREATE TABLE IF NOT EXISTS feature_flags (
  flag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL UNIQUE,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('incident', 'feature', 'experiment')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'tenant', 'provider', 'service')),
  scope_value TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend existing tables for Phase 3
ALTER TABLE api_logs
  ADD COLUMN IF NOT EXISTS sla_breach BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sla_target_ms INTEGER,
  ADD COLUMN IF NOT EXISTS cost_cutoff_triggered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replay_protected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shadow_traffic BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS incident_mode_active BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE api_webhook_events
  ADD COLUMN IF NOT EXISTS replay_detection_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS dlq_job_id UUID REFERENCES webhook_dlq(dlq_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_dlq BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE ai_apis
  ADD COLUMN IF NOT EXISTS sandbox_strictly_isolated BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS contract_test_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_contract_test_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_test_status TEXT;

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_api_key_staging_api_ready ON api_key_staging(api_id, ready_to_activate);
CREATE INDEX IF NOT EXISTS idx_replay_protection_key_expiry ON replay_protection_records(idempotency_key, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_tests_active_due ON api_contract_tests(is_active, last_test_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sla_targets_tenant_active ON api_sla_targets(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_dlq_unresolved ON webhook_dlq(is_resolved, next_retry_at) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_shadow_traffic_jobs_status ON shadow_traffic_jobs(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled, flag_type);
CREATE INDEX IF NOT EXISTS idx_residency_rules_tenant ON api_residency_rules(tenant_id, is_active);

-- RLS
ALTER TABLE api_key_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE replay_protection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_contract_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sla_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_residency_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_traffic_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
