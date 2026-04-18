#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const checks = [
  {
    file: 'src/app/login/page.tsx',
    mustInclude: ['handleSubmit', 'const dashboardRoute =', 'router.push(dashboardRoute)']
  },
  {
    file: 'src/pages/control-panel/ControlPanelDashboard.tsx',
    mustInclude: ['DashboardLayout', 'ControlPanelContent']
  },
  {
    file: 'src/app/api/auth/me/route.ts',
    mustInclude: ['connectToDatabase', 'User.findById', 'NextResponse.json']
  },
  {
    file: 'src/app/api/auth/login/route.ts',
    mustInclude: ['connectToDatabase', 'User.findOne', 'sign(', "cookies.set('auth_token'"]
  },
  {
    file: 'src/lib/api/edge-client.ts',
    mustInclude: ['X-App-Signature', 'X-Control-Panel-Origin']
  }
];

const failures = [];

for (const check of checks) {
  const fullPath = path.join(ROOT, check.file);
  if (!fs.existsSync(fullPath)) {
    failures.push(`missing file: ${check.file}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  for (const needle of check.mustInclude) {
    if (!content.includes(needle)) {
      failures.push(`${check.file} missing token: ${needle}`);
    }
  }
}

if (failures.length > 0) {
  console.error('FLOW INTEGRITY CHECK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Flow integrity check passed. login -> control-panel -> API -> DB path tokens present.');