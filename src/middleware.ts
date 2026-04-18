// @ts-nocheck
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_MINUTE = Number(process.env.API_RATE_LIMIT_PER_MINUTE || 120);
const rateWindow = new Map<string, { count: number; startedAt: number }>();

function isRateLimited(request: NextRequest): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  const current = rateWindow.get(key);

  if (!current || now - current.startedAt > RATE_WINDOW_MS) {
    rateWindow.set(key, { count: 1, startedAt: now });
    return false;
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_PER_MINUTE) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('auth_token')?.value;
  const appSignature = request.headers.get('x-app-signature') || '';
  const referer = request.headers.get('referer') || '';
  const expectedAppSignature = process.env.APP_SIGNATURE || 'dev-app-signature';
  const strictZeroTrust = process.env.STRICT_ZERO_TRUST_CONTROL_PANEL === 'true';
  const tenantId = request.cookies.get('tenant_id')?.value || request.headers.get('x-tenant-id') || '';
  const accessKeyStatus = request.cookies.get('access_key_status')?.value || request.headers.get('x-access-key-status') || '';
  const deviceId = request.cookies.get('device_id')?.value || request.headers.get('x-device-id') || '';

  const isPublicApiPath =
    pathname === '/api/auth/login' ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/auth/firebase/login') ||
    pathname.startsWith('/api/auth/firebase/google') ||
    pathname.startsWith('/api/apply');

  if (pathname.startsWith('/api') && !isPublicApiPath) {
    if (isRateLimited(request)) {
      return NextResponse.json({ error: 'API rate limit exceeded' }, { status: 429 });
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized API access' }, { status: 401 });
    }

    if (!appSignature || appSignature !== expectedAppSignature) {
      return NextResponse.json({ error: 'Invalid API signature' }, { status: 403 });
    }

    if (!referer.includes('/control-panel')) {
      return NextResponse.json({ error: 'Invalid control-panel origin' }, { status: 403 });
    }

    if (strictZeroTrust) {
      if (!tenantId) {
        return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
      }
      if (!deviceId) {
        return NextResponse.json({ error: 'Missing device context' }, { status: 403 });
      }
      if (accessKeyStatus !== 'active') {
        return NextResponse.json({ error: 'Inactive access key' }, { status: 403 });
      }
    }
  }

  const staticPrefixes = ['/_next/static', '/_next/image', '/static'];
  const allowedPrefixes = ['/login', '/control-panel', '/api'];
  const blockedPrefixes = [
    '/admin',
    '/super-admin',
    '/user',
    '/boss',
    '/franchise',
    '/influencer',
    '/dashboard',
    '/old',
    '/dev',
    '/staging',
    '/wireframe',
    '/legacy-ui',
  ];

  if (
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sw-cleanup.js' ||
    staticPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  if (blockedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const allowedPath = allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!allowedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (strictZeroTrust && pathname.startsWith('/control-panel')) {
    if (!tenantId || !deviceId || accessKeyStatus !== 'active') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/control-panel', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
