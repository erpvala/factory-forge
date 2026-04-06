-- AI API Manager Bulletproof Core Enhancements
-- Idempotency, request signing, retry config, circuit breaker, health scoring,
-- sandbox/live separation, secret rotation, selective cache, webhook capture,
-- schema validation, and usage billing.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_api_environment') THEN
    CREATE TYPE ai_api_environment AS ENUM ('sandbox', 'live');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_api_circuit_state') THEN
    CREATE TYPE ai_api_circuit_state AS ENUM ('closed', 'open', 'half_open');
  END IF;
END $$;

ALTER TABLE ai_apis
  ADD COLUMN IF NOT EXISTS timeout_ms INTEGER NOT NULL DEFAULT 15000,
  ADD COLUMN IF NOT EXISTS retry_max INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS circuit_state ai_api_circuit_state NOT NULL DEFAULT 'closed',
  ADD COLUMN IF NOT EXISTS circuit_failures INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS circuit_open_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS success_rate NUMERIC(6,2) NOT NULL DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS health_score NUMERIC(6,2) NOT NULL DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS cost_per_request NUMERIC(12,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS environment ai_api_environment NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS sandbox_api_key JSONB,
  ADD COLUMN IF NOT EXISTS sandbox_api_secret JSONB,
  ADD COLUMN IF NOT EXISTS signing_secret JSONB,
  ADD COLUMN IF NOT EXISTS cache_ttl_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS rotate_after_days INTEGER NOT NULL DEFAULT 90;

ALTER TABLE api_endpoints
  ADD COLUMN IF NOT EXISTS request_schema JSONB,
  ADD COLUMN IF NOT EXISTS response_schema JSONB,
  ADD COLUMN IF NOT EXISTS cacheable BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE api_logs
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
  ADD COLUMN IF NOT EXISTS provider_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS cached BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_amount NUMERIC(12,6) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS api_idempotency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  service_type TEXT NOT NULL,
  action TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE SET NULL,
  normalized_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  status api_log_status NOT NULL DEFAULT 'success',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, service_type, action)
);

CREATE TABLE IF NOT EXISTS api_response_cache (
  cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  action TEXT NOT NULL,
  response_payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_webhook_events (
  webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_usage_billing (
  billing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  log_id UUID REFERENCES api_logs(log_id) ON DELETE SET NULL,
  unit_cost NUMERIC(12,6) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cost NUMERIC(12,6) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_apis_environment ON ai_apis(environment);
CREATE INDEX IF NOT EXISTS idx_ai_apis_health ON ai_apis(api_name, environment, health_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_apis_circuit ON ai_apis(circuit_state, circuit_open_until);
CREATE INDEX IF NOT EXISTS idx_api_logs_idempotency ON api_logs(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_idempotency_lookup ON api_idempotency_records(idempotency_key, service_type, action);
CREATE INDEX IF NOT EXISTS idx_api_response_cache_lookup ON api_response_cache(cache_key, expires_at);
CREATE INDEX IF NOT EXISTS idx_api_webhook_provider ON api_webhook_events(provider, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_billing_api ON api_usage_billing(api_id, created_at DESC);

ALTER TABLE api_idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_billing ENABLE ROW LEVEL SECURITY;
