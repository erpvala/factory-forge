-- Phase 4: OPERATIONAL INFRASTRUCTURE HARDENING
-- 12 production controls: deadline propagation, priority queues, backpressure, adaptive concurrency,
-- connection pooling, TLS pinning, header normalization, response streaming, clock skew,
-- idempotent webhooks, retry budgets, graceful degradation

-- 1. DEADLINE TRACKING (deadline propagation + expiry)
CREATE TABLE api_deadline_tracking (
  deadline_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES api_tenants(tenant_id),
  request_id UUID NOT NULL UNIQUE,
  max_time_ms BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (created_at + (max_time_ms || ' ms')::INTERVAL) STORED,
  consumed_ms BIGINT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_deadline_tracking_tenant_expires ON api_deadline_tracking(tenant_id, expires_at);
CREATE INDEX idx_deadline_tracking_request_id ON api_deadline_tracking(request_id);

-- 2. PRIORITY QUEUE DEFINITIONS
CREATE TABLE api_priority_queue_config (
  priority_queue_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES api_tenants(tenant_id),
  queue_name TEXT NOT NULL,
  priority_level INT NOT NULL CHECK (priority_level BETWEEN 1 AND 10),
  -- 1=critical (payment), 5=normal, 10=background
  concurrency_limit INT DEFAULT 10,
  max_queue_depth INT DEFAULT 1000,
  timeout_ms INT DEFAULT 30000,
  retry_limit INT DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, queue_name)
);

CREATE INDEX idx_priority_queue_config_tenant_active ON api_priority_queue_config(tenant_id, is_active);

-- 3. PRIORITY QUEUE JOBS (pending requests)
CREATE TABLE api_priority_queue_jobs (
  job_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  queue_name TEXT NOT NULL,
  request_id UUID NOT NULL,
  priority_level INT NOT NULL,
  enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'timeout')),
  retry_count INT DEFAULT 0,
  FOREIGN KEY (tenant_id, queue_name) REFERENCES api_priority_queue_config(tenant_id, queue_name) ON DELETE CASCADE
);

CREATE INDEX idx_priority_queue_jobs_status ON api_priority_queue_jobs(tenant_id, status, priority_level DESC, enqueued_at);
CREATE INDEX idx_priority_queue_jobs_request_id ON api_priority_queue_jobs(request_id);

-- 4. BACKPRESSURE CONTROL (rate limiting + load shedding)
CREATE TABLE api_backpressure_config (
  backpressure_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES api_tenants(tenant_id),
  provider TEXT NOT NULL,
  rps_limit INT DEFAULT 100 CHECK (rps_limit > 0),
  concurrent_request_limit INT DEFAULT 50 CHECK (concurrent_request_limit > 0),
  queue_depth_threshold INT DEFAULT 500,
  -- when queue exceeds this, trigger backpressure
  load_shed_strategy TEXT DEFAULT 'fifo' CHECK (load_shed_strategy IN ('fifo', 'lifo', 'priority')),
  backpressure_timeout_ms INT DEFAULT 5000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_backpressure_config_tenant_active ON api_backpressure_config(tenant_id, is_active, provider);

-- 5. ADAPTIVE CONCURRENCY PER PROVIDER
CREATE TABLE api_adaptive_concurrency (
  concurrency_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  current_limit INT DEFAULT 10,
  min_limit INT DEFAULT 2,
  max_limit INT DEFAULT 100,
  ramp_up_rate DECIMAL(4, 2) DEFAULT 1.1,
  ramp_down_rate DECIMAL(4, 2) DEFAULT 0.9,
  success_rate_threshold DECIMAL(5, 2) DEFAULT 90.0,
  latency_threshold_ms INT DEFAULT 1000,
  last_adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  adjustment_count INT DEFAULT 0,
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_adaptive_concurrency_tenant_provider ON api_adaptive_concurrency(tenant_id, provider);

-- 6. CONNECTION POOL MANAGEMENT
CREATE TABLE api_connection_pool_config (
  pool_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  min_pool_size INT DEFAULT 5 CHECK (min_pool_size >= 0),
  max_pool_size INT DEFAULT 50 CHECK (max_pool_size >= min_pool_size),
  idle_timeout_ms INT DEFAULT 30000,
  max_lifetime_ms INT DEFAULT 600000,
  validation_interval_ms INT DEFAULT 10000,
  enable_keep_alive BOOLEAN DEFAULT TRUE,
  keep_alive_interval_ms INT DEFAULT 30000,
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_connection_pool_config_tenant_provider ON api_connection_pool_config(tenant_id, provider);

-- 7. TLS PINNING CONFIGURATION
CREATE TABLE api_tls_pinning_config (
  tls_pin_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  certificate_sha256_fingerprint TEXT NOT NULL,
  public_key_sha256 TEXT,
  issuer_name TEXT,
  subject_name TEXT,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  pinning_mode TEXT DEFAULT 'certificate' CHECK (pinning_mode IN ('certificate', 'public_key')),
  backup_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_tls_pinning_config_tenant_provider ON api_tls_pinning_config(tenant_id, provider, is_active);
CREATE INDEX idx_tls_pinning_config_fingerprint ON api_tls_pinning_config(certificate_sha256_fingerprint);

-- 8. HEADER NORMALIZATION RULES
CREATE TABLE api_header_normalization_rules (
  header_rule_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  source_header TEXT NOT NULL,
  target_header TEXT NOT NULL,
  transformation_type TEXT DEFAULT 'pass_through' CHECK (transformation_type IN ('pass_through', 'lowercase', 'uppercase', 'base64_encode', 'base64_decode', 'hash_sha256')),
  required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, provider, source_header)
);

CREATE INDEX idx_header_normalization_rules_tenant_provider ON api_header_normalization_rules(tenant_id, provider, is_active);

-- 9. CLOCK SKEW CORRECTION OFFSETS
CREATE TABLE api_clock_skew_corrections (
  skew_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  offset_ms BIGINT DEFAULT 0,
  -- positive = provider is ahead, negative = provider is behind
  detection_count INT DEFAULT 0,
  last_detected_at TIMESTAMP WITH TIME ZONE,
  correction_confidence DECIMAL(5, 2) DEFAULT 50.0,
  auto_correct BOOLEAN DEFAULT TRUE,
  max_auto_correction_ms INT DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_clock_skew_corrections_tenant_provider ON api_clock_skew_corrections(tenant_id, provider);

-- 10. IDEMPOTENT WEBHOOK EVENT DEDUPLICATION
CREATE TABLE api_webhook_event_dedup (
  webhook_dedup_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload_hash TEXT NOT NULL,
  retry_count INT DEFAULT 0,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_retry_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'processed' CHECK (status IN ('processed', 'pending_retry', 'failed', 'archived')),
  ttl_days INT DEFAULT 7,
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, event_id, provider)
);

CREATE INDEX idx_webhook_event_dedup_tenant_event ON api_webhook_event_dedup(tenant_id, event_id, received_at);
CREATE INDEX idx_webhook_event_dedup_status ON api_webhook_event_dedup(tenant_id, status, last_retry_at);

-- 11. REQUEST RETRY BUDGET (cap total retries)
CREATE TABLE api_retry_budget_config (
  retry_budget_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  max_retries_per_request INT DEFAULT 3 CHECK (max_retries_per_request > 0),
  max_total_retries_per_minute INT DEFAULT 100,
  retry_cost_weight DECIMAL(5, 2) DEFAULT 1.0,
  exponential_backoff_base INT DEFAULT 2,
  max_backoff_ms INT DEFAULT 30000,
  jitter_enabled BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_retry_budget_config_tenant_active ON api_retry_budget_config(tenant_id, is_active, provider);

-- 12. GRACEFUL DEGRADATION RULES (non-critical failure continuation)
CREATE TABLE api_degradation_rules (
  degradation_rule_id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  service_component TEXT NOT NULL,
  -- e.g., 'webhook', 'logging', 'enrichment', 'analytics'
  criticality_level TEXT DEFAULT 'non_critical' CHECK (criticality_level IN ('critical', 'semi_critical', 'non_critical')),
  action_on_failure TEXT DEFAULT 'continue' CHECK (action_on_failure IN ('continue', 'fallback', 'queue', 'circuit_break')),
  fallback_provider TEXT,
  fallback_timeout_ms INT DEFAULT 5000,
  alert_on_failure BOOLEAN DEFAULT FALSE,
  max_consecutive_failures INT DEFAULT 10,
  recovery_strategy TEXT DEFAULT 'exponential' CHECK (recovery_strategy IN ('immediate', 'linear', 'exponential')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES api_tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, provider, service_component)
);

CREATE INDEX idx_degradation_rules_tenant_component ON api_degradation_rules(tenant_id, service_component, is_active);

-- EXTEND api_logs WITH PHASE 4 COLUMNS
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS deadline_exceeded BOOLEAN DEFAULT FALSE;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS deadline_consumed_ms BIGINT;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS priority_queue_wait_ms BIGINT;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS backpressure_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS adaptive_concurrency_limit INT;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS connection_pool_acquired_ms BIGINT;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS tls_pin_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS clock_skew_corrected_ms BIGINT;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS webhook_deduplicated BOOLEAN DEFAULT FALSE;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS retry_budget_consumed INT DEFAULT 0;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS degradation_active BOOLEAN DEFAULT FALSE;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS response_streaming_used BOOLEAN DEFAULT FALSE;

-- RLS POLICIES (tenant isolation)
ALTER TABLE api_deadline_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY deadline_tracking_tenant_isolation ON api_deadline_tracking
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_priority_queue_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY priority_queue_config_tenant_isolation ON api_priority_queue_config
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_priority_queue_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY priority_queue_jobs_tenant_isolation ON api_priority_queue_jobs
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_backpressure_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY backpressure_config_tenant_isolation ON api_backpressure_config
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_adaptive_concurrency ENABLE ROW LEVEL SECURITY;
CREATE POLICY adaptive_concurrency_tenant_isolation ON api_adaptive_concurrency
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_connection_pool_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY connection_pool_config_tenant_isolation ON api_connection_pool_config
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_tls_pinning_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY tls_pinning_config_tenant_isolation ON api_tls_pinning_config
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_header_normalization_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY header_normalization_rules_tenant_isolation ON api_header_normalization_rules
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_clock_skew_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY clock_skew_corrections_tenant_isolation ON api_clock_skew_corrections
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_webhook_event_dedup ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_event_dedup_tenant_isolation ON api_webhook_event_dedup
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_retry_budget_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY retry_budget_config_tenant_isolation ON api_retry_budget_config
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));

ALTER TABLE api_degradation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY degradation_rules_tenant_isolation ON api_degradation_rules
  USING (tenant_id IN (SELECT tenant_id FROM api_tenants WHERE org_id = auth.uid()::TEXT));
