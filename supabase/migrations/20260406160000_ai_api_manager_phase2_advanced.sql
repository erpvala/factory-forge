-- AI API Manager Phase 2: Advanced Enterprise Controls
-- Multi-tenant isolation, request tracing, geo-routing, policies, bulk execution, adaptive intelligence

-- Multi-tenant support
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_isolation_level') THEN
    CREATE TYPE tenant_isolation_level AS ENUM ('shared', 'isolated', 'dedicated');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS api_tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL UNIQUE,
  org_name TEXT NOT NULL,
  isolation_level tenant_isolation_level NOT NULL DEFAULT 'isolated',
  budget_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_used NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cost_alert_threshold NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend ai_apis with multi-tenant + cost + geo
ALTER TABLE ai_apis
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS geo_region TEXT,
  ADD COLUMN IF NOT EXISTS cost_per_1k_requests NUMERIC(12,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adaptive_timeout_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeout_increase_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_timeout_increase_at TIMESTAMPTZ;

-- Request tracing
CREATE TABLE IF NOT EXISTS api_request_traces (
  trace_id TEXT PRIMARY KEY,
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  action TEXT NOT NULL,
  schema_version TEXT DEFAULT 'v1',
  trace_start_ms BIGINT,
  trace_end_ms BIGINT,
  trace_duration_ms INTEGER,
  status api_log_status,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Geo-routing endpoints
CREATE TABLE IF NOT EXISTS api_geo_endpoints (
  geo_endpoint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID NOT NULL REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  country_code TEXT,
  base_url TEXT NOT NULL,
  latency_ms_average INTEGER DEFAULT 0,
  is_healthy BOOLEAN NOT NULL DEFAULT true,
  last_health_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (api_id, region)
);

-- Tenant-scoped API keys with versioning
CREATE TABLE IF NOT EXISTS api_tenant_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE SET NULL,
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'live',
  schema_version TEXT DEFAULT 'v1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE (tenant_id, key_name, environment)
);

-- Policy & guard rules
CREATE TABLE IF NOT EXISTS api_policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  api_id UUID REFERENCES api_apis(api_id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('allow', 'deny', 'rate_limit', 'cost_limit')),
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions TEXT[] NOT NULL DEFAULT '{}',
  service_types TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bulk execution jobs
CREATE TABLE IF NOT EXISTS api_bulk_jobs (
  bulk_job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  api_id UUID REFERENCES api_apis(api_id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  action TEXT NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  successful_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  items_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'partial_failure', 'completed', 'failed')),
  error_summary JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payload redaction rules
CREATE TABLE IF NOT EXISTS api_redaction_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  field_names TEXT[] NOT NULL,
  redaction_type TEXT NOT NULL DEFAULT 'mask' CHECK (redaction_type IN ('mask', 'truncate', 'hash', 'remove')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend api_logs with tracing & redaction
ALTER TABLE api_logs
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trace_id TEXT REFERENCES api_request_traces(trace_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS request_payload_redacted JSONB,
  ADD COLUMN IF NOT EXISTS response_payload_redacted JSONB,
  ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS geo_region TEXT,
  ADD COLUMN IF NOT EXISTS bulk_job_id UUID REFERENCES api_bulk_jobs(bulk_job_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_dry_run BOOLEAN NOT NULL DEFAULT false;

-- Schema version support
CREATE TABLE IF NOT EXISTS api_schema_versions (
  version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  action TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  request_schema JSONB,
  response_schema JSONB,
  is_deprecated BOOLEAN NOT NULL DEFAULT false,
  deprecation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_type, action, schema_version)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_api_tenants_org_id ON api_tenants(org_id);
CREATE INDEX IF NOT EXISTS idx_api_request_traces_tenant_trace ON api_request_traces(tenant_id, trace_id DESC);
CREATE INDEX IF NOT EXISTS idx_api_geo_endpoints_region_health ON api_geo_endpoints(region, is_healthy);
CREATE INDEX IF NOT EXISTS idx_api_tenant_keys_tenant_active ON api_tenant_keys(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_policies_tenant_active ON api_policies(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_bulk_jobs_tenant_status ON api_bulk_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_api_logs_tenant_trace ON api_logs(tenant_id, trace_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_bulk_job ON api_logs(bulk_job_id);

-- RLS policies
ALTER TABLE api_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_geo_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tenant_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_bulk_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_redaction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_schema_versions ENABLE ROW LEVEL SECURITY;
