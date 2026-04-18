#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const CONFIG_PATHS = [
  path.join(ROOT, 'route_config.json'),
  path.join(ROOT, 'public', 'route_config.json'),
];

function hashConfig(parsed) {
  const canonical = JSON.stringify({
    allowed: parsed.allowed,
    banned: parsed.banned,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

const violations = [];
let rootSignature = null;

for (const configPath of CONFIG_PATHS) {
  if (!fs.existsSync(configPath)) {
    violations.push(`missing config: ${path.relative(ROOT, configPath)}`);
    continue;
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const signature = hashConfig(parsed);

  if (parsed.signature !== signature) {
    violations.push(
      `${path.relative(ROOT, configPath)} signature mismatch expected=${signature} found=${parsed.signature}`,
    );
  }

  if (!rootSignature) {
    rootSignature = signature;
  } else if (rootSignature !== signature) {
    violations.push(`config mismatch detected between route config files`);
  }
}

if (violations.length > 0) {
  console.error('ROUTE CONFIG SIGNATURE CHECK FAILED.');
  for (const item of violations) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

console.log(`Route config signature check passed: ${rootSignature}`);