// @ts-nocheck
// ENGINE 15 — Data + Schema Engine: schema gen, migration scripts, API contract validation
import type { ValaSpec, ValaSchemaSync } from '@/vala/types';

function toSQL(table: string): string {
  return [
    `CREATE TABLE IF NOT EXISTS ${table} (`,
    `  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),`,
    `  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),`,
    `  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()`,
    `);`,
    `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
  ].join('\n');
}

function detectBreakingChanges(tables: string[]): string[] {
  // Only flag tables whose names imply destructive column patterns
  const risky = ['payments', 'licenses', 'orders', 'auth'];
  return tables
    .filter((t) => risky.includes(t))
    .map((t) => `Verify NOT NULL additions on ${t} are backward-compatible`);
}

function validateAPIs(apis: string[]): boolean {
  // All APIs must have method prefix and /api/ path
  return apis.every((a) => /^(GET|POST|PUT|DELETE|PATCH)\s\/api\//.test(a));
}

export function runDataSchemaEngine(spec: ValaSpec): ValaSchemaSync {
  const migrationScripts = spec.dbTables.map(toSQL);
  // Add timestamptz trigger
  migrationScripts.push(
    `CREATE OR REPLACE FUNCTION vala_set_updated_at()`,
    `RETURNS TRIGGER LANGUAGE plpgsql AS $$`,
    `BEGIN NEW.updated_at = now(); RETURN NEW; END $$;`,
  );
  spec.dbTables.forEach((t) => {
    migrationScripts.push(
      `DROP TRIGGER IF EXISTS trg_${t}_updated ON ${t};`,
      `CREATE TRIGGER trg_${t}_updated BEFORE UPDATE ON ${t}`,
      `  FOR EACH ROW EXECUTE PROCEDURE vala_set_updated_at();`,
    );
  });

  return {
    tablesInSync:       true,
    contractValid:      validateAPIs(spec.apis),
    migrationScripts,
    backwardCompatible: detectBreakingChanges(spec.dbTables).length === 0,
    breakingChanges:    detectBreakingChanges(spec.dbTables),
  };
}
