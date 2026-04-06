// @ts-nocheck

export type ManagedServiceType =
  | 'payment'
  | 'email'
  | 'sms'
  | 'sms_otp'
  | 'storage'
  | 'push'
  | 'maps'
  | 'map_geo'
  | 'analytics';

export type ManagedProvider =
  | 'razorpay'
  | 'stripe'
  | 'sendgrid'
  | 'ses'
  | 'aws-ses'
  | 'twilio'
  | 'msg91'
  | 's3'
  | 'aws-s3'
  | 'cloudinary'
  | 'firebase'
  | 'firebase-fcm'
  | 'google'
  | 'google-maps'
  | 'google-analytics'
  | 'mixpanel';

export type ManagedApiStatus = 'active' | 'inactive';
export type ManagedApiEnvironment = 'sandbox' | 'live';
export type ManagedCircuitState = 'closed' | 'open' | 'half_open';

export interface ManagedApiRecord {
  api_id: string;
  api_name: ManagedServiceType;
  provider: ManagedProvider | string;
  base_url: string | null;
  status: ManagedApiStatus;
  rate_limit: number;
  usage_limit?: number;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  priority: number;
  timeout_ms: number;
  retry_max: number;
  circuit_state: ManagedCircuitState;
  success_rate: number;
  avg_latency_ms: number;
  health_score: number;
  cost_per_request: number;
  environment: ManagedApiEnvironment;
  cache_ttl_seconds: number;
  last_rotated_at: string;
  rotate_after_days: number;
}

export interface ManagedApiEndpointRecord {
  endpoint_id: string;
  api_id: string;
  endpoint_name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers_template: Record<string, unknown> | null;
  body_template: Record<string, unknown> | null;
  request_schema: Record<string, unknown> | null;
  response_schema: Record<string, unknown> | null;
  cacheable: boolean;
}

export interface ExecuteManagedApiInput {
  service: ManagedServiceType;
  action: string;
  data: Record<string, unknown>;
  queueIfBusy?: boolean;
  idempotency_key?: string;
  sandbox_mode?: boolean;
  route_by?: 'balanced' | 'cost' | 'speed' | 'success_rate';
}

export interface NormalizedApiResponse<T = unknown> {
  status: boolean;
  data: T;
  message: string;
}

export interface ManagedApiLogRecord {
  log_id: string;
  api_id: string;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  status: 'success' | 'failed' | 'queued';
  error_message: string | null;
  timestamp: string;
}

export interface ManagedApiMonitorSnapshot {
  totalCalls: number;
  failedCalls: number;
  failureRate: number;
  avgLatencyMs: number;
  usageSpikeDetected: boolean;
  recommendedAction: 'switch_provider' | 'alert_admin' | 'optimize_usage' | 'stable';
  totalCost?: number;
  cachedResponses?: number;
}

export interface ManagedApiWebhookEvent {
  webhook_id: string;
  api_id: string | null;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  normalized_payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}
