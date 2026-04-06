-- AI API Manager — Central Integration Hub
-- Stores encrypted provider credentials, usage tracking, and error monitoring

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status') THEN
    CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_category') THEN
    CREATE TYPE integration_category AS ENUM (
      'payment',
      'email',
      'sms_otp',
      'storage',
      'push',
      'map_geo',
      'analytics',
      'oauth',
      'hosting'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ai_api_manager_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id TEXT NOT NULL UNIQUE,
  api_name TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  category integration_category NOT NULL,
  api_key_encrypted JSONB NOT NULL,
  api_secret_encrypted JSONB,
  encrypted_credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  masked_credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  status integration_status NOT NULL DEFAULT 'inactive',
  usage_limit BIGINT NOT NULL DEFAULT 0 CHECK (usage_limit >= 0),
  usage_count BIGINT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  error_count BIGINT NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  last_error TEXT,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_api_manager_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES ai_api_manager_integrations(id) ON DELETE CASCADE,
  api_id TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  latency_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_api_manager_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES ai_api_manager_integrations(id) ON DELETE CASCADE,
  api_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_api_manager_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES ai_api_manager_integrations(id) ON DELETE SET NULL,
  api_id TEXT,
  action TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION ai_api_manager_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_api_manager_integrations_updated_at ON ai_api_manager_integrations;
CREATE TRIGGER trg_ai_api_manager_integrations_updated_at
  BEFORE UPDATE ON ai_api_manager_integrations
  FOR EACH ROW EXECUTE FUNCTION ai_api_manager_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ai_api_manager_integrations_api_id ON ai_api_manager_integrations(api_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_manager_integrations_category ON ai_api_manager_integrations(category);
CREATE INDEX IF NOT EXISTS idx_ai_api_manager_integrations_status ON ai_api_manager_integrations(status);
CREATE INDEX IF NOT EXISTS idx_ai_api_manager_integrations_owner ON ai_api_manager_integrations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_manager_usage_logs_api_id ON ai_api_manager_usage_logs(api_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_manager_usage_logs_created_at ON ai_api_manager_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_api_manager_error_logs_api_id ON ai_api_manager_error_logs(api_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_manager_error_logs_severity ON ai_api_manager_error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_ai_api_manager_audit_logs_api_id ON ai_api_manager_audit_logs(api_id);

ALTER TABLE ai_api_manager_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_manager_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_manager_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_manager_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_api_manager_integrations' AND policyname = 'ai_api_manager_integrations_select_owner'
  ) THEN
    CREATE POLICY ai_api_manager_integrations_select_owner
      ON ai_api_manager_integrations
      FOR SELECT
      USING (owner_user_id = auth.uid() OR auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_api_manager_integrations' AND policyname = 'ai_api_manager_integrations_insert_owner'
  ) THEN
    CREATE POLICY ai_api_manager_integrations_insert_owner
      ON ai_api_manager_integrations
      FOR INSERT
      WITH CHECK (owner_user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_api_manager_integrations' AND policyname = 'ai_api_manager_integrations_update_owner'
  ) THEN
    CREATE POLICY ai_api_manager_integrations_update_owner
      ON ai_api_manager_integrations
      FOR UPDATE
      USING (owner_user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_api_manager_usage_logs' AND policyname = 'ai_api_manager_usage_logs_select_owner'
  ) THEN
    CREATE POLICY ai_api_manager_usage_logs_select_owner
      ON ai_api_manager_usage_logs
      FOR SELECT
      USING (
        integration_id IN (
          SELECT id FROM ai_api_manager_integrations WHERE owner_user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_api_manager_error_logs' AND policyname = 'ai_api_manager_error_logs_select_owner'
  ) THEN
    CREATE POLICY ai_api_manager_error_logs_select_owner
      ON ai_api_manager_error_logs
      FOR SELECT
      USING (
        integration_id IN (
          SELECT id FROM ai_api_manager_integrations WHERE owner_user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_api_manager_audit_logs' AND policyname = 'ai_api_manager_audit_logs_select_authenticated'
  ) THEN
    CREATE POLICY ai_api_manager_audit_logs_select_authenticated
      ON ai_api_manager_audit_logs
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
