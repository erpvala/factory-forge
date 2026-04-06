// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import type {
  ExecuteManagedApiInput,
  ManagedApiRecord,
  ManagedApiMonitorSnapshot,
  NormalizedApiResponse,
} from '@/lib/ai-api-manager/types';

export async function executeManagedApi<T = unknown>(input: ExecuteManagedApiInput): Promise<NormalizedApiResponse<T>> {
  const { data, error } = await supabase.functions.invoke('ai-api-execute', {
    body: JSON.stringify(input),
  });

  if (error) {
    return {
      status: false,
      data: {} as T,
      message: error.message || 'Failed to execute managed API',
    };
  }

  return {
    status: !!data?.status,
    data: (data?.data ?? {}) as T,
    message: data?.message || 'Managed API request processed',
  };
}

export async function listManagedApis(): Promise<ManagedApiRecord[]> {
  const { data, error } = await supabase.functions.invoke('ai-api-admin', {
    body: JSON.stringify({ action: 'list' }),
  });

  if (error) {
    throw error;
  }

  return data?.items || [];
}

export async function registerManagedApi(payload: {
  api_name: string;
  provider: string;
  api_key?: string;
  api_secret?: string | null;
  secret_key?: string | null;
  account_sid?: string;
  auth_token?: string;
  access_key?: string;
  server_key?: string;
  tracking_id?: string;
  client_id?: string;
  client_secret?: string | null;
  token?: string;
  base_url: string;
  rate_limit?: number;
  usage_limit?: number;
  priority?: number;
  timeout_ms?: number;
  retry_max?: number;
  cost_per_request?: number;
  environment?: 'sandbox' | 'live';
  sandbox_api_key?: string | null;
  sandbox_api_secret?: string | null;
  signing_secret?: string | null;
  cache_ttl_seconds?: number;
  rotate_after_days?: number;
  endpoints?: Array<{
    endpoint_name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    headers_template?: Record<string, unknown>;
    body_template?: Record<string, unknown>;
    request_schema?: Record<string, unknown>;
    response_schema?: Record<string, unknown>;
    cacheable?: boolean;
  }>;
}) {
  const { data, error } = await supabase.functions.invoke('ai-api-admin', {
    body: JSON.stringify({ action: 'register', payload }),
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function toggleManagedApi(api_id: string, status: 'active' | 'inactive') {
  const { data, error } = await supabase.functions.invoke('ai-api-admin', {
    body: JSON.stringify({ action: 'toggle', payload: { api_id, status } }),
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function rotateManagedApiSecret(payload: {
  api_id: string;
  api_key?: string;
  api_secret?: string | null;
  sandbox_api_key?: string | null;
  sandbox_api_secret?: string | null;
  signing_secret?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke('ai-api-admin', {
    body: JSON.stringify({ action: 'rotate', payload }),
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchManagedApiMonitor(service?: string): Promise<ManagedApiMonitorSnapshot> {
  const { data, error } = await supabase.functions.invoke('ai-api-admin', {
    body: JSON.stringify({ action: 'monitor', payload: { service } }),
  });

  if (error) {
    throw error;
  }

  return data?.snapshot;
}

export async function handleManagedApiWebhook(payload: {
  provider: string;
  event_type: string;
  signature?: string;
  payload: Record<string, unknown>;
}) {
  const { data, error } = await supabase.functions.invoke('ai-api-webhook', {
    body: JSON.stringify(payload),
  });

  if (error) {
    throw error;
  }

  return data;
}
