#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const REPORT_PATH = path.join(ROOT, 'test-out.json', 'ui-audit-report.json');

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_NAME = [/\.d\.ts$/i, /\.test\./i, /\.spec\./i, /\.stories\./i];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(abs, out);
    } else if (SOURCE_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(abs);
    }
  }
  return out;
}

function normalize(p) {
  return p.replace(/\\/g, '/');
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const fromDir = path.dirname(fromFile);
  const base = path.resolve(fromDir, spec);
  const tries = [
    base,
    `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`,
    path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js'), path.join(base, 'index.jsx'),
  ];
  for (const t of tries) {
    if (fs.existsSync(t) && fs.statSync(t).isFile()) return t;
  }
  return 'MISSING';
}

const files = walk(SRC);
const fileSet = new Set(files.map((f) => path.resolve(f)));
const importGraph = new Map();
const missingImports = [];

const importRegex = /(?:import\s+[^'"`]*?from\s*|import\s*\()\s*["'`]([^"'`]+)["'`]/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const deps = new Set();
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    const spec = m[1];
    const resolved = resolveImport(file, spec);
    if (resolved === 'MISSING') {
      missingImports.push({
        file: normalize(path.relative(ROOT, file)),
        import: spec,
      });
      continue;
    }
    if (resolved) deps.add(path.resolve(resolved));
  }
  importGraph.set(path.resolve(file), deps);
}

const entryCandidates = [
  path.join(SRC, 'main.tsx'),
  path.join(SRC, 'main.ts'),
  path.join(SRC, 'App.tsx'),
].filter((p) => fs.existsSync(p));

const visited = new Set();
const stack = [...entryCandidates.map((p) => path.resolve(p))];
while (stack.length) {
  const cur = stack.pop();
  if (!cur || visited.has(cur)) continue;
  visited.add(cur);
  const deps = importGraph.get(cur);
  if (!deps) continue;
  for (const d of deps) {
    if (fileSet.has(d) && !visited.has(d)) stack.push(d);
  }
}

const orphanFiles = files
  .filter((f) => !visited.has(path.resolve(f)))
  .filter((f) => !SKIP_NAME.some((r) => r.test(path.basename(f))))
  .map((f) => normalize(path.relative(ROOT, f)));

const pageDir = path.join(SRC, 'pages');
const duplicatePages = [];
if (fs.existsSync(pageDir)) {
  const pageFiles = walk(pageDir);
  const map = new Map();
  for (const p of pageFiles) {
    const name = path.basename(p).toLowerCase();
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(normalize(path.relative(ROOT, p)));
  }
  for (const [name, list] of map) {
    if (list.length > 1) duplicatePages.push({ name, files: list });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  orphanFiles,
  missingImports,
  duplicatePages,
  summary: {
    orphanCount: orphanFiles.length,
    missingImportCount: missingImports.length,
    duplicatePageCount: duplicatePages.length,
  },
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

console.log(`UI audit report written: ${normalize(path.relative(ROOT, REPORT_PATH))}`);
console.log(`Orphans=${report.summary.orphanCount} MissingImports=${report.summary.missingImportCount} DuplicatePages=${report.summary.duplicatePageCount}`);

if (report.summary.orphanCount > 0 || report.summary.missingImportCount > 0 || report.summary.duplicatePageCount > 0) {
  process.exit(1);
}
