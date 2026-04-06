#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INCLUDE_DIRS = ['src', 'public', 'api', 'scripts'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.html', '.json', '.md']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'cache', 'test-results', 'coverage']);

const BANNED_PATTERNS = [
  /super-admin-system/gi,
  /role-switch\?role=/gi,
  /super-admin-wireframe/gi,
  /\/wireframe\//gi,
  /RoleSwitchDashboard/gi,
  /ContinentSuperAdminView/gi,
  /BossOwnerDashboard/gi,
  /Legacy\s+RoleSidebar/gi,
  /old[_-]?ui/gi,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (EXTENSIONS.has(ext)) out.push(abs);
  }
  return out;
}

function lineCol(text, index) {
  const upTo = text.slice(0, index);
  const lines = upTo.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

const files = INCLUDE_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const findings = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of BANNED_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const { line, col } = lineCol(content, match.index);
      findings.push({
        file: path.relative(ROOT, file).replace(/\\/g, '/'),
        line,
        col,
        token: match[0],
      });
      if (findings.length >= 400) break;
    }
    if (findings.length >= 400) break;
  }
  if (findings.length >= 400) break;
}

if (findings.length > 0) {
  console.error('BANNED UI TRACE DETECTED. Build blocked.');
  for (const f of findings) {
    console.error(` - ${f.file}:${f.line}:${f.col} -> ${f.token}`);
  }
  process.exit(1);
}

console.log('Legacy UI guard passed: no banned UI traces found.');
