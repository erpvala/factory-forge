import { getStoredToken, saveSession, type AuthResponse, type AuthSession, type AuthUser } from '@/api/v1/auth';

const API_BASE = '/api/v1';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface ApplicationPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  mobile: string;
  applicationData: Record<string, unknown>;
}

export interface ApplicationRecord {
  id: string;
  user_id: string;
  requested_role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by?: string | null;
  application_data?: Record<string, unknown> | null;
  full_name?: string | null;
  phone?: string | null;
  user_email?: string | null;
  user_status?: string | null;
  assigned_role?: string | null;
}

interface ApplicationsResponse {
  success: boolean;
  data?: { applications: ApplicationRecord[] };
  error?: string;
}

interface ReviewResponse {
  success: boolean;
  data?: { id: string; status: 'approved' | 'rejected' };
  error?: string;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  return response.json() as Promise<T>;
}

export async function submitApplication(payload: ApplicationPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/apply', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      application_data: payload.applicationData,
    }),
  });
}

export async function getApplications(): Promise<ApplicationsResponse> {
  return apiFetch<ApplicationsResponse>('/applications', { method: 'GET' }, getStoredToken());
}

export async function approveApplication(requestId: string): Promise<ReviewResponse> {
  return apiFetch<ReviewResponse>('/applications/approve', {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId }),
  }, getStoredToken());
}

export async function rejectApplication(requestId: string): Promise<ReviewResponse> {
  return apiFetch<ReviewResponse>('/applications/reject', {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId }),
  }, getStoredToken());
}

export function persistApplicationSession(session: AuthSession | null | undefined, user: AuthUser | undefined) {
  if (session && user) {
    saveSession(session, user);
  }
}