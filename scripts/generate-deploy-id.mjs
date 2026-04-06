#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const deployId = `deploy-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${Math.random().toString(36).slice(2, 8)}`;
const outPath = path.join(ROOT, 'public', 'deploy-id.json');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ deployId, generatedAt: new Date().toISOString() }, null, 2));

console.log(`Generated deploy ID: ${deployId}`);
console.log(`Wrote ${path.relative(ROOT, outPath).replace(/\\/g, '/')}`);
