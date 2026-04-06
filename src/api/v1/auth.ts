// src/api/v1/auth.ts
// Typed client for /api/v1/auth/* (Supabase Edge Function: auth-v1)
// ──────────────────────────────────────────────────────────────────────────────
// Routes exposed:
//   POST /register  → register new user
//   POST /login     → authenticate + get JWT
//   POST /logout    → invalidate session
//   GET  /me        → get current user from token
// ──────────────────────────────────────────────────────────────────────────────
import { ROUTES, getRoleDashboardRoute } from '@/routes/routes';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ─── Strict spec routes (/api/v1/auth/*) ─────────────────────────────────────
// Dev:  Vite proxy  /api/v1/auth/* → {SUPABASE_URL}/functions/v1/auth-v1/*
// Prod: Vercel serverless /api/v1/auth/{register|login|logout|me}
//       → proxies to Supabase Edge Function
const AUTH_API_URL = '/api/v1/auth';
const DEVICE_KEY = 'sv.device.id';

function getDeviceHeaderValue() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const generated = `${navigator.userAgent}|${screen.width}x${screen.height}|${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_KEY, generated);
  return generated;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  user_id:    string;
  name:       string;
  email:      string;
  role:       string;
  status:     'PENDING' | 'ACTIVE' | 'REJECTED';
  created_at?: string;
  roles?:     { role: string; approval_status: string }[];
}

export interface AuthSession {
  access_token:  string;
  refresh_token: string;
  expires_at?:   number;
  token_type:    string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user:     AuthUser;
    session:  AuthSession | null;
    redirect: string;
    message?: string;
    requires_2fa?: boolean;
    challenge_id?: string;
    email_verification_required?: boolean;
  };
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  data?: {
    session: AuthSession;
    redirect?: string;
  };
  error?: string;
}

export interface MeResponse {
  success: boolean;
  data?: { user: AuthUser };
  error?: string;
}

// ─── Internal fetch wrapper ───────────────────────────────────────────────────

async function authFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_ANON_KEY,
    'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
    'x-device-id':   getDeviceHeaderValue(),
    'x-device-name': navigator.userAgent.slice(0, 120),
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  try {
    const res = await fetch(`${AUTH_API_URL}${path}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    const json = await res.json();
    return json as T;
  } catch {
    return {
      success: false,
      error: 'Authentication service temporarily unavailable. Please try again.',
    } as T;
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function apiRegister(
  name: string,
  email: string,
  password: string,
  role = 'user',
): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function apiLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function apiLogout(token: string): Promise<{ success: boolean; error?: string }> {
  return authFetch('/logout', {
    method: 'POST',
    token,
  });
}

export async function apiLogoutAll(token: string): Promise<{ success: boolean; error?: string }> {
  return authFetch('/logout-all', {
    method: 'POST',
    token,
  });
}

export async function apiRefresh(refreshToken: string): Promise<RefreshResponse> {
  const result = await authFetch<RefreshResponse>('/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (result.success && result.data?.session) {
    localStorage.setItem(TOKEN_KEY, result.data.session.access_token);
    localStorage.setItem(REFRESH_KEY, result.data.session.refresh_token);
  }

  return result;
}

// ─── Me ───────────────────────────────────────────────────────────────────────
export async function apiMe(token: string): Promise<MeResponse> {
  return authFetch<MeResponse>('/me', {
    method: 'GET',
    token,
  });
}

// ─── Token helpers (localStorage) ────────────────────────────────────────────

const TOKEN_KEY        = 'sv.auth.token';
const REFRESH_KEY      = 'sv.auth.refresh';
const USER_KEY         = 'sv.auth.user';
const REMEMBER_KEY     = 'sv.auth.remember';

function shouldRememberSession() {
  return localStorage.getItem(REMEMBER_KEY) !== '0';
}

function getActiveStorage() {
  return shouldRememberSession() ? localStorage : sessionStorage;
}

export function saveSession(session: AuthSession, user: AuthUser) {
  const storage = getActiveStorage();
  storage.setItem(TOKEN_KEY,   session.access_token);
  storage.setItem(REFRESH_KEY, session.refresh_token);
  storage.setItem(USER_KEY,    JSON.stringify(user));

  // Ensure old values in the other storage are cleared to avoid ambiguity.
  const other = storage === localStorage ? sessionStorage : localStorage;
  other.removeItem(TOKEN_KEY);
  other.removeItem(REFRESH_KEY);
  other.removeItem(USER_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ─── Role → redirect path helper ─────────────────────────────────────────────

export function getRoleRedirectPath(role: string, status: 'PENDING' | 'ACTIVE' | 'REJECTED'): string {
  if (status === 'PENDING') return ROUTES.pendingApproval;
  if (status === 'REJECTED') return ROUTES.accessDenied;
  return getRoleDashboardRoute(role);
}
