#!/usr/bin/env node
import { setTimeout as sleep } from 'node:timers/promises';

const BASE_URL = process.env.ROUTE_SELF_TEST_BASE_URL || 'http://127.0.0.1:4173';

const checks = [
  { path: '/login', expected: 'allow' },
  { path: '/control-panel', expected: 'allow-or-login' },
  { path: '/random123', expected: 'login' },
  { path: '/admin', expected: 'login' },
  { path: '/user/dashboard', expected: 'login' },
];

function isLoginPath(pathname) {
  return pathname === '/login' || pathname === '/control-panel/login';
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(`${BASE_URL}/login`, { redirect: 'follow' });
      if (res.ok || res.status === 304) {
        return;
      }
    } catch {
      // Wait and retry.
    }
    await sleep(1000);
  }
  throw new Error(`Server not reachable at ${BASE_URL}`);
}

function assertRoute(pathname, expected) {
  if (expected === 'allow') {
    return pathname.endsWith('/login');
  }

  if (expected === 'allow-or-login') {
    return pathname === '/control-panel' || isLoginPath(pathname);
  }

  if (expected === 'login') {
    return isLoginPath(pathname);
  }

  return false;
}

async function run() {
  await waitForServer();

  const failures = [];
  for (const check of checks) {
    const response = await fetch(`${BASE_URL}${check.path}`, { redirect: 'follow' });
    const finalUrl = response.url;
    const finalPathname = new URL(finalUrl).pathname;
    const ok = assertRoute(finalPathname, check.expected);

    if (!ok) {
      failures.push({
        path: check.path,
        expected: check.expected,
        got: finalPathname,
      });
    }
  }

  if (failures.length > 0) {
    console.error('CONTROL PANEL SELF-TEST FAILED.');
    for (const failure of failures) {
      console.error(` - ${failure.path} expected=${failure.expected} got=${failure.got}`);
    }
    process.exit(1);
  }

  console.log('Control panel self-test passed. All blocked paths resolved to login as expected.');
}

run().catch((error) => {
  console.error('Control panel self-test crashed:', error.message || error);
  process.exit(1);
});