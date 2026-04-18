#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EDGE_CLIENT = path.join(ROOT, 'src', 'lib', 'api', 'edge-client.ts');

if (!fs.existsSync(EDGE_CLIENT)) {
  console.error('LATENCY LOCK CHECK FAILED.');
  console.error(' - missing src/lib/api/edge-client.ts');
  process.exit(1);
}

const content = fs.readFileSync(EDGE_CLIENT, 'utf8');
const failures = [];

if (!/DEFAULT_RETRY_COUNT\s*=\s*3/.test(content)) {
  failures.push('retry_count_not_locked_to_3');
}
if (!/DEFAULT_TIMEOUT_MS\s*=\s*12000/.test(content)) {
  failures.push('default_timeout_not_locked');
}
if (!/responseCache/.test(content)) {
  failures.push('client_cache_missing');
}
if (!/fallback/i.test(content)) {
  failures.push('fallback_strategy_missing');
}
if (!/duration_ms/.test(content)) {
  failures.push('latency_metrics_logging_missing');
}

if (failures.length > 0) {
  console.error('LATENCY LOCK CHECK FAILED.');
  for (const item of failures) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

console.log('Latency lock check passed: retries, cache, fallback, and latency metrics are present.');
