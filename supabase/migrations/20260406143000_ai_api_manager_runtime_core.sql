-- AI API Manager Runtime Core
-- Server-only external provider execution tables

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_api_status') THEN
    CREATE TYPE ai_api_status AS ENUM ('active', 'inactive');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_log_status') THEN
    CREATE TYPE api_log_status AS ENUM ('success', 'failed', 'queued');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ai_apis (
  api_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key JSONB NOT NULL,
  api_secret JSONB,
  base_url TEXT,
  status ai_api_status NOT NULL DEFAULT 'inactive',
  rate_limit BIGINT NOT NULL DEFAULT 0 CHECK (rate_limit >= 0),
  usage_count BIGINT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  last_used_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_endpoints (
  endpoint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID NOT NULL REFERENCES ai_apis(api_id) ON DELETE CASCADE,
  endpoint_name TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  path TEXT NOT NULL,
  headers_template JSONB,
  body_template JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (api_id, endpoint_name)
);

CREATE TABLE IF NOT EXISTS api_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE SET NULL,
  request_payload JSONB,
  response_payload JSONB,
  status api_log_status NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_queue_jobs (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID REFERENCES ai_apis(api_id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed')),
  retries INTEGER NOT NULL DEFAULT 0 CHECK (retries >= 0),
  max_retries INTEGER NOT NULL DEFAULT 3 CHECK (max_retries >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_apis_service_status_priority ON ai_apis(api_name, status, priority);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_api_action ON api_endpoints(api_id, endpoint_name);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_time ON api_logs(api_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_time ON api_logs(status, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_queue_jobs_status_time ON api_queue_jobs(status, available_at ASC);

ALTER TABLE ai_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_queue_jobs ENABLE ROW LEVEL SECURITY;

-- No user-facing policies: service-role / edge-functions only.

COMMENT ON TABLE ai_apis IS 'Server-only provider credentials and routing metadata for AI API Manager';
COMMENT ON TABLE api_endpoints IS 'Endpoint templates per provider for internal action routing';
COMMENT ON TABLE api_logs IS 'Normalized request/response logs for AI monitoring and failover';
COMMENT ON TABLE api_queue_jobs IS 'Async queue for email, push, notification, and heavy requests';
