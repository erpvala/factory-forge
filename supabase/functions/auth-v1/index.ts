// @ts-nocheck
// Supabase Edge Function: auth-v1
// Core routes (strict):
//   POST /register | POST /login | POST /logout | GET /me
// Extended routes:
//   POST /refresh | POST /logout-all | POST /2fa/request | POST /2fa/verify
//   POST /email/verify | POST /role/switch
//   GET  /devices | GET /login-history

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_EXPIRY_SECS  = 60 * 15; // short JWT (15 min)

const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_BLOCK  = 20 * 60 * 1000;

const OTP_EXPIRY_MIN = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-device-name',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function err(message: string, status = 400, meta: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ success: false, error: message, ...meta }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomToken(length = 64): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function nowISO() {
  return new Date().toISOString();
}

function normalizeIP(req: Request): string {
  const raw = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  return raw.split(',')[0].trim() || 'unknown';
}

function deviceFromRequest(req: Request): { id: string; name: string; ua: string } {
  const ua = req.headers.get('user-agent') ?? 'unknown_device';
  const id = req.headers.get('x-device-id') ?? `ua:${ua.slice(0, 100)}`;
  const name = req.headers.get('x-device-name') ?? ua.slice(0, 120);
  return { id, name, ua };
}

async function ensureApplicationsAdmin(req: Request, supabase: ReturnType<typeof adminClient>) {
  const { authUser } = await getCurrentAuthUser(req, supabase);
  if (!authUser) return { error: err('Unauthorized', 401), authUser: null };

  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authUser.id)
    .eq('approval_status', 'approved')
    .in('role', ['boss_owner', 'super_admin', 'ceo'])
    .limit(1)
    .maybeSingle();

  if (!adminRole) return { error: err('Forbidden', 403), authUser: null };
  return { error: null, authUser };
}

async function resolveUserAccessState(
  supabase: ReturnType<typeof adminClient>,
  authId: string,
  fallbackRole: string,
  fallbackStatus: string,
) {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role, approval_status')
    .eq('user_id', authId);

  const assignments = roles ?? [];
  const approved = assignments.find((row) => row.approval_status === 'approved' && row.role === fallbackRole)
    ?? assignments.find((row) => row.approval_status === 'approved');
  if (approved) {
    return { role: approved.role, status: 'ACTIVE', roles: assignments };
  }

  const pending = assignments.find((row) => row.approval_status === 'pending');
  if (pending) {
    return { role: pending.role ?? fallbackRole, status: 'PENDING', roles: assignments };
  }

  const rejected = assignments.find((row) => row.approval_status === 'rejected');
  if (rejected) {
    return { role: rejected.role ?? fallbackRole, status: 'REJECTED', roles: assignments };
  }

  return { role: fallbackRole, status: fallbackStatus, roles: assignments };
}

async function createPendingAccount(
  req: Request,
  body: Record<string, unknown>,
  options: { applicationData?: Record<string, unknown> | null; mobile?: string | null } = {},
): Promise<Response> {
  const { name, email, password, role = 'user' } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name?.trim()) return err('Name is required');
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Valid email is required');
  if (!isStrongPassword(password ?? '')) {
    return err('Password must be 8+ chars with upper, lower, number, special char');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedRole = role.trim();
  const supabase = adminClient();

  const { data: existing } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing?.user_id) return err('Email is already registered', 409);

  const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: false,
    user_metadata: { full_name: name.trim(), role: normalizedRole },
  });

  if (authError || !authData?.user) {
    return err(authError?.message ?? 'Failed to create user', 500);
  }

  const authUser = authData.user;

  const { data: publicUser, error: puError } = await supabase
    .from('users')
    .upsert({
      auth_id: authUser.id,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: null,
      status: 'PENDING',
      failed_login_attempts: 0,
      lock_until: null,
    }, { onConflict: 'auth_id' })
    .select('user_id, name, email, role, status, created_at')
    .single();

  if (puError) {
    await supabase.auth.admin.deleteUser(authUser.id);
    return err('Failed to create user profile', 500);
  }

  await supabase
    .from('profiles')
    .upsert({
      user_id: authUser.id,
      full_name: name.trim(),
      phone: options.mobile ?? null,
      updated_at: nowISO(),
    }, { onConflict: 'user_id' })
    .catch(() => {});

  await supabase.from('role_requests').insert({
    user_id: authUser.id,
    requested_role: normalizedRole,
    status: 'pending',
    application_data: options.applicationData ?? null,
  }).catch(async () => {
    await supabase.from('role_requests').insert({
      user_id: authUser.id,
      requested_role: normalizedRole,
      status: 'pending',
    }).catch(() => {});
  });

  await supabase.from('user_roles').upsert({
    user_id: authUser.id,
    role: normalizedRole,
    approval_status: 'pending',
  }, { onConflict: 'user_id,role' }).catch(async () => {
    await supabase.from('user_roles').insert({
      user_id: authUser.id,
      role: normalizedRole,
      approval_status: 'pending',
    }).catch(() => {});
  });

  const verifyToken = randomToken(32);
  const verifyHash = await sha256(verifyToken);

  await supabase.from('email_verifications').insert({
    user_id: publicUser.user_id,
    token_hash: verifyHash,
    expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  await logActivity(supabase, {
    userId: publicUser.user_id,
    eventType: 'user_registered',
    riskLevel: 'low',
  });

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInError || !signInData?.session) {
    return ok({
      user: publicUser,
      session: null,
      redirect: '/dashboard/pending',
      email_verification_required: true,
      message: 'Account created. Verify email to get full access.',
    }, 201);
  }

  const session = signInData.session;
  const ip = normalizeIP(req);
  const device = deviceFromRequest(req);
  const deviceId = await upsertDevice(supabase, publicUser.user_id, device, ip);

  await storeSession(
    supabase,
    publicUser.user_id,
    session.access_token,
    session.refresh_token,
    ip,
    device.ua,
    deviceId,
  );

  await logLogin(supabase, {
    userId: publicUser.user_id,
    email: publicUser.email,
    ip,
    device: device.name,
    success: true,
  });

  return ok({
    user: { ...publicUser, email_verified: false },
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      token_type: 'bearer',
    },
    redirect: '/dashboard/pending',
    email_verification_required: true,
    verification_token_preview: Deno.env.get('ENV') === 'development' ? verifyToken : undefined,
  }, 201);
}

function isStrongPassword(password: string): boolean {
  // 8+ with uppercase, lowercase, number, special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

async function checkRateLimit(identifier: string): Promise<boolean> {
  const supabase = adminClient();
  const now = new Date();

  const { data } = await supabase
    .from('auth_rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .maybeSingle();

  if (!data) {
    await supabase.from('auth_rate_limits').insert({
      identifier,
      attempts: 1,
      first_attempt: now.toISOString(),
      last_attempt: now.toISOString(),
    });
    return true;
  }

  if (data.blocked_until && new Date(data.blocked_until) > now) return false;

  const firstAttempt = new Date(data.first_attempt);
  const windowExpired = now.getTime() - firstAttempt.getTime() > RATE_LIMIT_WINDOW;

  if (windowExpired) {
    await supabase
      .from('auth_rate_limits')
      .update({ attempts: 1, first_attempt: now.toISOString(), last_attempt: now.toISOString(), blocked_until: null })
      .eq('identifier', identifier);
    return true;
  }

  const newAttempts = data.attempts + 1;
  if (newAttempts > RATE_LIMIT_MAX) {
    const blockedUntil = new Date(now.getTime() + RATE_LIMIT_BLOCK);
    await supabase
      .from('auth_rate_limits')
      .update({ attempts: newAttempts, last_attempt: now.toISOString(), blocked_until: blockedUntil.toISOString() })
      .eq('identifier', identifier);
    return false;
  }

  await supabase
    .from('auth_rate_limits')
    .update({ attempts: newAttempts, last_attempt: now.toISOString() })
    .eq('identifier', identifier);

  return true;
}

async function logLogin(
  supabase: ReturnType<typeof adminClient>,
  payload: { userId?: string | null; email?: string; ip?: string; device?: string; success: boolean; failureReason?: string }
) {
  await supabase.from('login_logs').insert({
    user_id: payload.userId ?? null,
    email: payload.email ?? null,
    ip: payload.ip ?? null,
    location: 'unknown',
    device: payload.device ?? null,
    success: payload.success,
    failure_reason: payload.failureReason ?? null,
    timestamp: nowISO(),
  }).catch(() => {});
}

async function logActivity(
  supabase: ReturnType<typeof adminClient>,
  payload: { userId?: string | null; eventType: string; riskLevel?: string; ip?: string; device?: string; metadata?: Record<string, unknown> }
) {
  await supabase.from('activity_events').insert({
    user_id: payload.userId ?? null,
    event_type: payload.eventType,
    risk_level: payload.riskLevel ?? 'low',
    ip_address: payload.ip ?? null,
    device: payload.device ?? null,
    metadata: payload.metadata ?? {},
  }).catch(() => {});
}

async function upsertDevice(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  device: { id: string; name: string; ua: string },
  ip: string,
) {
  const { data: existing } = await supabase
    .from('user_devices')
    .select('device_id')
    .eq('user_id', userId)
    .eq('device_fingerprint', device.id)
    .maybeSingle();

  if (existing?.device_id) {
    await supabase
      .from('user_devices')
      .update({ last_login: nowISO(), user_agent: device.ua, ip_address: ip, device_name: device.name })
      .eq('device_id', existing.device_id);
    return existing.device_id;
  }

  const { data: created } = await supabase
    .from('user_devices')
    .insert({
      user_id: userId,
      device_fingerprint: device.id,
      device_name: device.name,
      user_agent: device.ua,
      ip_address: ip,
      last_login: nowISO(),
    })
    .select('device_id')
    .single();

  return created?.device_id ?? null;
}

async function storeSession(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  token: string,
  refreshToken: string,
  ip: string,
  userAgent: string,
  deviceId?: string | null,
) {
  const expiry = new Date(Date.now() + JWT_EXPIRY_SECS * 1000).toISOString();
  await supabase.from('sessions').insert({
    user_id: userId,
    token,
    refresh_token: refreshToken,
    expiry,
    ip_address: ip || null,
    user_agent: userAgent || null,
    device_id: deviceId ?? null,
    last_active_at: nowISO(),
  });
}

function resolveRedirect(role: string, status: string): string {
  if (status === 'PENDING') return '/dashboard/pending';
  if (status === 'REJECTED') return '/access-denied';

  const map: Record<string, string> = {
    developer: '/developer/dashboard',
    influencer: '/influencer/dashboard',
    reseller: '/reseller/dashboard',
    franchise: '/franchise/dashboard',
    user: '/user/dashboard',
    franchise_owner: '/franchise/dashboard',
    franchise_manager: '/franchise-manager',
    reseller_manager: '/reseller-manager/dashboard',
    influencer_manager: '/influencer-manager',
    boss_owner: '/boss-panel',
    ceo: '/ai-ceo',
    super_admin: '/super-admin-system',
    admin: '/super-admin-system',
  };

  return map[role] ?? '/app';
}

async function getCurrentAuthUser(req: Request, supabase: ReturnType<typeof adminClient>) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return { token: null, authUser: null };

  const { data: { user: authUser } } = await supabase.auth.getUser(token);
  return { token, authUser };
}

async function handleRegister(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body) return err('Invalid JSON body');
  return createPendingAccount(req, body);
}

async function handleApply(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body) return err('Invalid JSON body');

  const applicationData = (body.application_data ?? body.applicationData ?? null) as Record<string, unknown> | null;
  const mobile = typeof body.mobile === 'string' ? body.mobile : null;

  return createPendingAccount(req, body, {
    applicationData,
    mobile,
  });
}

async function handleLogin(req: Request): Promise<Response> {
  const ip = normalizeIP(req);
  const body = await req.json().catch(() => null);
  if (!body) return err('Invalid JSON body');

  const { email, password } = body;
  if (!email || !password) return err('Email and password are required');

  const identifier = `${ip}:${email.toLowerCase().trim()}`;
  const allowed = await checkRateLimit(identifier);
  if (!allowed) {
    return err('Too many login attempts. Temporary block active.', 429);
  }

  const supabase = adminClient();
  const device = deviceFromRequest(req);

  const { data: publicUser, error: findError } = await supabase
    .from('users')
    .select('user_id, name, email, password_hash, role, status, auth_id, email_verified_at, lock_until, failed_login_attempts, two_factor_enabled')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (findError || !publicUser) {
    await logLogin(supabase, { email, ip, device: device.name, success: false, failureReason: 'invalid_credentials' });
    return err('Invalid credentials', 401);
  }

  if (publicUser.lock_until && new Date(publicUser.lock_until) > new Date()) {
    await logActivity(supabase, {
      userId: publicUser.user_id,
      eventType: 'blocked_login_while_locked',
      riskLevel: 'high',
      ip,
      device: device.name,
    });
    return err('Account temporarily locked due to suspicious activity', 423);
  }

  const passwordMatch = await bcrypt.compare(password, publicUser.password_hash);
  if (!publicUser.password_hash.startsWith('$supabase$') && !passwordMatch) {
    const attempts = (publicUser.failed_login_attempts ?? 0) + 1;
    const lockNow = attempts >= RATE_LIMIT_MAX;

    await supabase
      .from('users')
      .update({
        failed_login_attempts: attempts,
        lock_until: lockNow ? new Date(Date.now() + RATE_LIMIT_BLOCK).toISOString() : null,
      })
      .eq('user_id', publicUser.user_id);

    await logLogin(supabase, {
      userId: publicUser.user_id,
      email: publicUser.email,
      ip,
      device: device.name,
      success: false,
      failureReason: lockNow ? 'account_locked' : 'invalid_password',
    });

    if (lockNow) {
      await logActivity(supabase, {
        userId: publicUser.user_id,
        eventType: 'account_locked',
        riskLevel: 'high',
        ip,
        device: device.name,
      });
    }

    return err('Invalid credentials', 401);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (signInError || !signInData?.session) {
    await logLogin(supabase, {
      userId: publicUser.user_id,
      email: publicUser.email,
      ip,
      device: device.name,
      success: false,
      failureReason: 'supabase_auth_failed',
    });
    return err('Invalid credentials', 401);
  }

  // reset lock/fail counters on success
  await supabase
    .from('users')
    .update({ failed_login_attempts: 0, lock_until: null, last_login_at: nowISO() })
    .eq('user_id', publicUser.user_id);

  if (!publicUser.email_verified_at) {
    await logActivity(supabase, {
      userId: publicUser.user_id,
      eventType: 'login_requires_email_verification',
      riskLevel: 'medium',
      ip,
      device: device.name,
    });

    return err('Email verification required before full access', 403, {
      action: 'verify_email',
      redirect: '/dashboard/pending',
    });
  }

  if (publicUser.two_factor_enabled) {
    const otp = generateOtp();
    const otpHash = await sha256(otp);
    const expiry = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000).toISOString();

    const { data: challenge } = await supabase
      .from('otp_challenges')
      .insert({ user_id: publicUser.user_id, otp_hash: otpHash, expiry })
      .select('challenge_id')
      .single();

    await supabase.auth.admin.signOut(signInData.session.access_token).catch(() => {});

    return ok({
      requires_2fa: true,
      challenge_id: challenge?.challenge_id,
      message: 'OTP sent. Complete 2FA to finish login.',
      otp_preview: Deno.env.get('ENV') === 'development' ? otp : undefined,
    });
  }

  const session = signInData.session;
  const deviceId = await upsertDevice(supabase, publicUser.user_id, device, ip);

  await storeSession(
    supabase,
    publicUser.user_id,
    session.access_token,
    session.refresh_token,
    ip,
    device.ua,
    deviceId,
  );

  await logLogin(supabase, {
    userId: publicUser.user_id,
    email: publicUser.email,
    ip,
    device: device.name,
    success: true,
  });

  const accessState = await resolveUserAccessState(
    supabase,
    publicUser.auth_id,
    publicUser.role ?? 'user',
    publicUser.status,
  );

  if (accessState.role !== publicUser.role || accessState.status !== publicUser.status) {
    await supabase
      .from('users')
      .update({ role: accessState.role, status: accessState.status })
      .eq('user_id', publicUser.user_id);
  }

  const redirect = resolveRedirect(accessState.role, accessState.status);

  return ok({
    user: {
      user_id: publicUser.user_id,
      name: publicUser.name,
      email: publicUser.email,
      role: accessState.role,
      status: accessState.status,
    },
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      token_type: 'bearer',
    },
    redirect,
  });
}

async function handleRefresh(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body?.refresh_token) return err('Refresh token is required', 400);

  const supabase = adminClient();

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: body.refresh_token });
  if (error || !data?.session || !data?.user) {
    return err('Refresh token expired or invalid', 401);
  }

  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id, role, status, auth_id')
    .eq('auth_id', data.user.id)
    .maybeSingle();

  if (!publicUser?.user_id) return err('User not found', 404);

  const accessState = await resolveUserAccessState(
    supabase,
    publicUser.auth_id,
    publicUser.role ?? 'user',
    publicUser.status,
  );

  await supabase
    .from('sessions')
    .update({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expiry: new Date(Date.now() + JWT_EXPIRY_SECS * 1000).toISOString(),
      last_active_at: nowISO(),
      revoked_at: null,
      revoked_reason: null,
    })
    .eq('user_id', publicUser.user_id)
    .eq('refresh_token', body.refresh_token);

  return ok({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      token_type: 'bearer',
    },
    redirect: resolveRedirect(accessState.role, accessState.status),
  });
}

async function handleLogout(req: Request): Promise<Response> {
  const supabase = adminClient();
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) return err('No session token provided', 400);

  await supabase
    .from('sessions')
    .update({ revoked_at: nowISO(), revoked_reason: 'logout' })
    .eq('token', token);

  await supabase.auth.admin.signOut(token).catch(() => {});

  return ok({ message: 'Logged out successfully' });
}

async function handleLogoutAll(req: Request): Promise<Response> {
  const supabase = adminClient();
  const { authUser } = await getCurrentAuthUser(req, supabase);
  if (!authUser) return err('Unauthorized', 401);

  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', authUser.id)
    .maybeSingle();

  if (!publicUser?.user_id) return err('User not found', 404);

  await supabase
    .from('sessions')
    .update({ revoked_at: nowISO(), revoked_reason: 'logout_all' })
    .eq('user_id', publicUser.user_id)
    .is('revoked_at', null);

  await logActivity(supabase, {
    userId: publicUser.user_id,
    eventType: 'logout_all_devices',
    riskLevel: 'medium',
  });

  return ok({ message: 'All sessions revoked' });
}

async function handleMe(req: Request): Promise<Response> {
  const supabase = adminClient();
  const { token, authUser } = await getCurrentAuthUser(req, supabase);
  if (!token || !authUser) return err('Invalid or expired token', 401);

  const { data: publicUser, error: findError } = await supabase
    .from('users')
    .select('user_id, name, email, role, status, created_at, email_verified_at, two_factor_enabled')
    .eq('auth_id', authUser.id)
    .maybeSingle();

  if (findError || !publicUser) return err('User not found', 404);

  const accessState = await resolveUserAccessState(
    supabase,
    authUser.id,
    publicUser.role ?? 'user',
    publicUser.status,
  );

  const { data: sessionRow } = await supabase
    .from('sessions')
    .select('session_id, last_active_at, revoked_at')
    .eq('token', token)
    .maybeSingle();

  if (sessionRow?.revoked_at) return err('Session revoked', 401);

  await supabase
    .from('sessions')
    .update({ last_active_at: nowISO() })
    .eq('token', token);

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role, approval_status')
    .eq('user_id', authUser.id);

  return ok({
    user: {
      ...publicUser,
      role: accessState.role,
      status: accessState.status,
      roles: accessState.roles,
      email_verified: !!publicUser.email_verified_at,
    },
  });
}

async function handleEmailVerify(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (!token) return err('Verification token is required', 400);

  const supabase = adminClient();
  const tokenHash = await sha256(token);

  const { data: row } = await supabase
    .from('email_verifications')
    .select('id, user_id, expiry, verified_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!row) return err('Invalid verification token', 404);
  if (row.verified_at) return ok({ message: 'Email already verified' });
  if (new Date(row.expiry) < new Date()) return err('Verification token expired', 410);

  await supabase
    .from('email_verifications')
    .update({ verified_at: nowISO() })
    .eq('id', row.id);

  await supabase
    .from('users')
    .update({ email_verified_at: nowISO() })
    .eq('user_id', row.user_id);

  return ok({ message: 'Email verified successfully' });
}

async function handle2FARequest(req: Request): Promise<Response> {
  const supabase = adminClient();
  const { authUser } = await getCurrentAuthUser(req, supabase);
  if (!authUser) return err('Unauthorized', 401);

  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', authUser.id)
    .maybeSingle();

  if (!publicUser?.user_id) return err('User not found', 404);

  const otp = generateOtp();
  const otpHash = await sha256(otp);
  const expiry = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000).toISOString();

  const { data: challenge } = await supabase
    .from('otp_challenges')
    .insert({ user_id: publicUser.user_id, otp_hash: otpHash, expiry })
    .select('challenge_id')
    .single();

  return ok({
    challenge_id: challenge?.challenge_id,
    message: 'OTP generated. Deliver via email/SMS provider.',
    otp_preview: Deno.env.get('ENV') === 'development' ? otp : undefined,
  });
}

async function handle2FAVerify(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const challengeId = body?.challenge_id;
  const code = body?.code;

  if (!challengeId || !code) return err('challenge_id and code are required', 400);

  const supabase = adminClient();

  const { data: challenge } = await supabase
    .from('otp_challenges')
    .select('challenge_id, user_id, otp_hash, expiry, used_at, attempts')
    .eq('challenge_id', challengeId)
    .maybeSingle();

  if (!challenge) return err('Invalid challenge', 404);
  if (challenge.used_at) return err('OTP already used', 409);
  if (new Date(challenge.expiry) < new Date()) return err('OTP expired', 410);
  if ((challenge.attempts ?? 0) >= 5) return err('OTP attempts exceeded', 429);

  const codeHash = await sha256(code);
  if (codeHash !== challenge.otp_hash) {
    await supabase
      .from('otp_challenges')
      .update({ attempts: (challenge.attempts ?? 0) + 1 })
      .eq('challenge_id', challengeId);
    return err('Invalid OTP', 401);
  }

  await supabase
    .from('otp_challenges')
    .update({ used_at: nowISO() })
    .eq('challenge_id', challengeId);

  await supabase
    .from('users')
    .update({ two_factor_enabled: true, two_factor_method: 'otp' })
    .eq('user_id', challenge.user_id);

  return ok({ verified: true, message: '2FA verified' });
}

async function handleDevices(req: Request): Promise<Response> {
  const supabase = adminClient();
  const { authUser } = await getCurrentAuthUser(req, supabase);
  if (!authUser) return err('Unauthorized', 401);

  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', authUser.id)
    .maybeSingle();

  if (!publicUser?.user_id) return err('User not found', 404);

  const { data: devices } = await supabase
    .from('user_devices')
    .select('device_id, device_name, last_login, user_agent, ip_address, is_trusted, created_at')
    .eq('user_id', publicUser.user_id)
    .order('last_login', { ascending: false });

  return ok({ devices: devices ?? [] });
}

async function handleLoginHistory(req: Request): Promise<Response> {
  const supabase = adminClient();
  const { authUser } = await getCurrentAuthUser(req, supabase);
  if (!authUser) return err('Unauthorized', 401);

  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', authUser.id)
    .maybeSingle();

  if (!publicUser?.user_id) return err('User not found', 404);

  const { data: logs } = await supabase
    .from('login_logs')
    .select('ip, location, device, timestamp, success, failure_reason')
    .eq('user_id', publicUser.user_id)
    .order('timestamp', { ascending: false })
    .limit(100);

  return ok({ logs: logs ?? [] });
}

async function handleApplicationsList(req: Request): Promise<Response> {
  const supabase = adminClient();
  const { error: authError } = await ensureApplicationsAdmin(req, supabase);
  if (authError) return authError;

  const { data: requests, error: requestsError } = await supabase
    .from('role_requests')
    .select('id, user_id, requested_role, status, created_at, reviewed_at, reviewed_by, application_data')
    .order('created_at', { ascending: false });

  if (requestsError) return err('Failed to load applications', 500);

  const userIds = Array.from(new Set((requests ?? []).map((item) => item.user_id)));

  const [{ data: users }, { data: profiles }] = await Promise.all([
    userIds.length > 0
      ? supabase.from('users').select('auth_id, email, name, role, status').in('auth_id', userIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    userIds.length > 0
      ? supabase.from('profiles').select('user_id, full_name, phone').in('user_id', userIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const usersByAuthId = new Map((users ?? []).map((row: any) => [row.auth_id, row]));
  const profilesByUserId = new Map((profiles ?? []).map((row: any) => [row.user_id, row]));

  const applications = (requests ?? []).map((item: any) => {
    const user = usersByAuthId.get(item.user_id);
    const profile = profilesByUserId.get(item.user_id);
    return {
      ...item,
      full_name: profile?.full_name ?? user?.name ?? null,
      phone: profile?.phone ?? null,
      user_email: user?.email ?? null,
      user_status: user?.status ?? null,
      assigned_role: user?.role ?? null,
    };
  });

  return ok({ applications });
}

async function handleReviewApplication(req: Request, action: 'approved' | 'rejected'): Promise<Response> {
  const supabase = adminClient();
  const { error: authError, authUser } = await ensureApplicationsAdmin(req, supabase);
  if (authError || !authUser) return authError ?? err('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  const requestId = body?.request_id ?? body?.requestId ?? body?.id;
  if (!requestId) return err('request_id is required', 400);

  const { data: requestRow, error: requestError } = await supabase
    .from('role_requests')
    .select('id, user_id, requested_role')
    .eq('id', requestId)
    .maybeSingle();

  if (requestError || !requestRow) return err('Request not found', 404);

  const { error: updateError } = await supabase
    .from('role_requests')
    .update({ status: action, reviewed_by: authUser.id, reviewed_at: nowISO() })
    .eq('id', requestId);

  if (updateError) return err('Failed to update request', 500);

  await supabase
    .from('user_roles')
    .upsert({
      user_id: requestRow.user_id,
      role: requestRow.requested_role,
      approval_status: action,
    }, { onConflict: 'user_id,role' });

  await supabase
    .from('users')
    .update({
      status: action === 'approved' ? 'ACTIVE' : 'REJECTED',
      role: action === 'approved' ? requestRow.requested_role : undefined,
    })
    .eq('auth_id', requestRow.user_id);

  return ok({ id: requestId, status: action });
}

async function handleRoleSwitch(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const nextRole = body?.role;
  if (!nextRole) return err('role is required', 400);

  const supabase = adminClient();
  const { authUser } = await getCurrentAuthUser(req, supabase);
  if (!authUser) return err('Unauthorized', 401);

  const { data: ownRole } = await supabase
    .from('user_roles')
    .select('role, approval_status')
    .eq('user_id', authUser.id)
    .eq('role', nextRole)
    .eq('approval_status', 'approved')
    .maybeSingle();

  if (!ownRole) return err('Role not assigned or not approved', 403);

  const { data: publicUser } = await supabase
    .from('users')
    .update({ role: nextRole })
    .eq('auth_id', authUser.id)
    .select('role, status')
    .single();

  return ok({
    role: nextRole,
    redirect: resolveRedirect(publicUser?.role ?? nextRole, publicUser?.status ?? 'ACTIVE'),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/.*\/auth-v1/, '').replace(/\/$/, '') || '/';

  try {
    if (req.method === 'POST' && path === '/register') return await handleRegister(req);
    if (req.method === 'POST' && path === '/apply') return await handleApply(req);
    if (req.method === 'POST' && path === '/login') return await handleLogin(req);
    if (req.method === 'POST' && path === '/logout') return await handleLogout(req);
    if (req.method === 'POST' && path === '/refresh') return await handleRefresh(req);
    if (req.method === 'POST' && path === '/logout-all') return await handleLogoutAll(req);
    if (req.method === 'POST' && path === '/applications/approve') return await handleReviewApplication(req, 'approved');
    if (req.method === 'POST' && path === '/applications/reject') return await handleReviewApplication(req, 'rejected');
    if (req.method === 'POST' && path === '/2fa/request') return await handle2FARequest(req);
    if (req.method === 'POST' && path === '/2fa/verify') return await handle2FAVerify(req);
    if (req.method === 'POST' && path === '/email/verify') return await handleEmailVerify(req);
    if (req.method === 'POST' && path === '/role/switch') return await handleRoleSwitch(req);

    if (req.method === 'GET' && path === '/me') return await handleMe(req);
    if (req.method === 'GET' && path === '/applications') return await handleApplicationsList(req);
    if (req.method === 'GET' && path === '/devices') return await handleDevices(req);
    if (req.method === 'GET' && path === '/login-history') return await handleLoginHistory(req);

    return err('Route not found', 404);
  } catch (e) {
    console.error('[auth-v1] unhandled error:', e);
    return err('Authentication service temporarily unavailable. Please retry.', 503, { retryable: true });
  }
});
