-- ============================================================
-- VALA AI — Autonomous Software Factory Core
-- Migration: 20260406130000_vala_factory_core.sql
-- ============================================================

-- ── build_target enum ──────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'build_target') THEN
    CREATE TYPE build_target AS ENUM ('web', 'apk', 'software');
  END IF;
END $$;

-- ── pipeline_status enum ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_status') THEN
    CREATE TYPE pipeline_status AS ENUM ('idle', 'running', 'success', 'failed', 'healing');
  END IF;
END $$;

-- ── engine_status enum ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engine_status') THEN
    CREATE TYPE engine_status AS ENUM ('dormant', 'active', 'complete', 'error');
  END IF;
END $$;

-- ── vala_jobs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vala_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          TEXT NOT NULL UNIQUE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  idea            TEXT NOT NULL,
  project_name    TEXT,
  target          build_target NOT NULL DEFAULT 'web',
  status          pipeline_status NOT NULL DEFAULT 'idle',
  current_engine  SMALLINT NOT NULL DEFAULT 0 CHECK (current_engine BETWEEN 0 AND 20),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── vala_engine_events ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vala_engine_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      TEXT NOT NULL REFERENCES vala_jobs(job_id) ON DELETE CASCADE,
  engine_id   SMALLINT NOT NULL CHECK (engine_id BETWEEN 1 AND 20),
  engine_name TEXT NOT NULL,
  status      engine_status NOT NULL DEFAULT 'dormant',
  output      JSONB,
  error_msg   TEXT,
  duration_ms INTEGER,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── vala_build_artifacts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vala_build_artifacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        TEXT NOT NULL REFERENCES vala_jobs(job_id) ON DELETE CASCADE,
  target        build_target NOT NULL,
  artifact_path TEXT NOT NULL,
  size_mb       NUMERIC(8,2),
  duration_ms   INTEGER,
  signed        BOOLEAN NOT NULL DEFAULT false,
  download_url  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── vala_deployments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vala_deployments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          TEXT NOT NULL REFERENCES vala_jobs(job_id) ON DELETE CASCADE,
  environment     TEXT NOT NULL CHECK (environment IN ('dev','stage','prod')),
  strategy        TEXT NOT NULL CHECK (strategy IN ('blue-green','canary','rolling')),
  url             TEXT,
  status          TEXT NOT NULL CHECK (status IN ('deployed','failed','rolling-back')),
  health_check    BOOLEAN NOT NULL DEFAULT false,
  rollback_version TEXT,
  deployed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── vala_self_heal_patches ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vala_self_heal_patches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          TEXT NOT NULL REFERENCES vala_jobs(job_id) ON DELETE CASCADE,
  error_id        TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  patch_type      TEXT NOT NULL CHECK (patch_type IN ('ast_edit','hotfix','config_change')),
  description     TEXT,
  hotfix_branch   TEXT,
  applied         BOOLEAN NOT NULL DEFAULT false,
  retested        BOOLEAN NOT NULL DEFAULT false,
  redeployed      BOOLEAN NOT NULL DEFAULT false,
  rolled_back     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── vala_audit_log (immutable) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vala_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      TEXT,
  action      TEXT NOT NULL,
  actor       TEXT NOT NULL,
  module      TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Audit rows must never be updated or deleted
CREATE OR REPLACE RULE vala_audit_no_update AS ON UPDATE TO vala_audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE vala_audit_no_delete AS ON DELETE TO vala_audit_log DO INSTEAD NOTHING;

-- ── vala_queue_jobs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vala_queue_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      TEXT NOT NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('email','notify','payout','build','deploy')),
  payload     JSONB NOT NULL DEFAULT '{}',
  retries     SMALLINT NOT NULL DEFAULT 0,
  max_retries SMALLINT NOT NULL DEFAULT 3,
  in_dlq      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- ── vala_recovery_snapshots ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vala_recovery_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           TEXT NOT NULL REFERENCES vala_jobs(job_id) ON DELETE CASCADE,
  snapshot_id      TEXT NOT NULL UNIQUE,
  rollback_version TEXT NOT NULL,
  feature_flags    JSONB NOT NULL DEFAULT '{}',
  ab_tests         JSONB NOT NULL DEFAULT '{}',
  restored_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── updated_at triggers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION vala_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_vala_jobs_updated ON vala_jobs;
CREATE TRIGGER trg_vala_jobs_updated
  BEFORE UPDATE ON vala_jobs
  FOR EACH ROW EXECUTE PROCEDURE vala_set_updated_at();

-- ── Performance Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vala_jobs_user_id       ON vala_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_vala_jobs_status        ON vala_jobs(status);
CREATE INDEX IF NOT EXISTS idx_vala_jobs_target        ON vala_jobs(target);
CREATE INDEX IF NOT EXISTS idx_vala_jobs_started_at    ON vala_jobs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vala_engine_events_job  ON vala_engine_events(job_id);
CREATE INDEX IF NOT EXISTS idx_vala_engine_events_id   ON vala_engine_events(engine_id);
CREATE INDEX IF NOT EXISTS idx_vala_deployments_job    ON vala_deployments(job_id);
CREATE INDEX IF NOT EXISTS idx_vala_queue_channel      ON vala_queue_jobs(channel);
CREATE INDEX IF NOT EXISTS idx_vala_queue_dlq          ON vala_queue_jobs(in_dlq) WHERE in_dlq = true;
CREATE INDEX IF NOT EXISTS idx_vala_audit_job          ON vala_audit_log(job_id);
CREATE INDEX IF NOT EXISTS idx_vala_audit_action       ON vala_audit_log(action);

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE vala_jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE vala_engine_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vala_build_artifacts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vala_deployments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vala_self_heal_patches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vala_audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vala_queue_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vala_recovery_snapshots ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────────────────
-- Users own their jobs
CREATE POLICY "vala_jobs_owner_select" ON vala_jobs
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "vala_jobs_owner_insert" ON vala_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "vala_jobs_owner_update" ON vala_jobs
  FOR UPDATE USING (user_id = auth.uid());

-- Engine events readable by job owner (join via job_id text match)
CREATE POLICY "vala_engine_events_select" ON vala_engine_events
  FOR SELECT USING (
    job_id IN (SELECT job_id FROM vala_jobs WHERE user_id = auth.uid())
  );

CREATE POLICY "vala_engine_events_insert" ON vala_engine_events
  FOR INSERT WITH CHECK (
    job_id IN (SELECT job_id FROM vala_jobs WHERE user_id = auth.uid())
  );

-- Artifacts readable by job owner
CREATE POLICY "vala_artifacts_select" ON vala_build_artifacts
  FOR SELECT USING (
    job_id IN (SELECT job_id FROM vala_jobs WHERE user_id = auth.uid())
  );

-- Audit log: readable by authenticated users (immutable, no write policy needed)
CREATE POLICY "vala_audit_select" ON vala_audit_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Queue: service role only (managed server-side)
CREATE POLICY "vala_queue_service_only" ON vala_queue_jobs
  FOR ALL USING (false);

-- ── Sample seed: verify tables exist ─────────────────────────────────────
DO $$
DECLARE
  tbl_count INT;
BEGIN
  SELECT COUNT(*) INTO tbl_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'vala_jobs',
      'vala_engine_events',
      'vala_build_artifacts',
      'vala_deployments',
      'vala_self_heal_patches',
      'vala_audit_log',
      'vala_queue_jobs',
      'vala_recovery_snapshots'
    );

  IF tbl_count < 8 THEN
    RAISE EXCEPTION 'VALA migration incomplete: only % / 8 tables created', tbl_count;
  END IF;

  RAISE NOTICE 'VALA AI Factory Core migration: all % tables OK', tbl_count;
END $$;
