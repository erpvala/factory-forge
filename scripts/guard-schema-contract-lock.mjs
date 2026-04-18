#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const files = {
  modules: path.join(ROOT, 'src', 'config', 'controlPanelModules.ts'),
  edge: path.join(ROOT, 'src', 'lib', 'api', 'edge-client.ts'),
  sync: path.join(ROOT, 'src', 'services', 'systemSyncGuard.ts'),
  migration: path.join(ROOT, 'scripts', 'run-data-migration.mjs'),
};

const failures = [];

for (const filePath of Object.values(files)) {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file: ${path.relative(ROOT, filePath)}`);
  }
}

if (failures.length === 0) {
  const modulesContent = fs.readFileSync(files.modules, 'utf8');
  const edgeContent = fs.readFileSync(files.edge, 'utf8');
  const syncContent = fs.readFileSync(files.sync, 'utf8');
  const migrationContent = fs.readFileSync(files.migration, 'utf8');

  if (!modulesContent.includes('schemaVersion')) {
    failures.push('module registry missing schemaVersion field');
  }

  if (!edgeContent.includes('X-Schema-Version')) {
    failures.push('edge client missing X-Schema-Version header');
  }

  if (!edgeContent.includes('assertContractRequest') || !edgeContent.includes('assertContractResponse')) {
    failures.push('edge client missing contract request/response validation');
  }

  if (!syncContent.includes('schema_version')) {
    failures.push('startup sync guard missing schema version checks');
  }

  if (!migrationContent.includes('ENTITY_DEFS')) {
    failures.push('migration script missing entity transformation contract');
  }
}

if (failures.length > 0) {
  console.error('SCHEMA CONTRACT LOCK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Schema contract lock passed.');
