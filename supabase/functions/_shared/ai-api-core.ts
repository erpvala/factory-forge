const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const HASH_ALGORITHM = 'SHA-256';

export async function deriveKey(password: string, salt: Uint8Array, usage: KeyUsage[] = ['encrypt', 'decrypt']): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuffer, iterations: ITERATIONS, hash: HASH_ALGORITHM },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    usage,
  );
}

export async function encryptValue(plaintext: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: ENCRYPTION_ALGORITHM, iv }, key, encoder.encode(plaintext));
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  };
}

export async function decryptValue(encryptedData: any, password: string): Promise<string> {
  if (!encryptedData) return '';
  const salt = new Uint8Array(atob(encryptedData.salt).split('').map((c) => c.charCodeAt(0)));
  const iv = new Uint8Array(atob(encryptedData.iv).split('').map((c) => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(encryptedData.ciphertext).split('').map((c) => c.charCodeAt(0)));
  const key = await deriveKey(password, salt, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: ENCRYPTION_ALGORITHM, iv }, key, ciphertext);
  return decoder.decode(decrypted);
}

export async function sha256(data: string): Promise<string> {
  const buffer = await crypto.subtle.digest(HASH_ALGORITHM, encoder.encode(data));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hmacSign(data: string, secret: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: HASH_ALGORITHM },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function maskValue(value?: string | null) {
  if (!value) return null;
  if (value.length <= 6) return '*'.repeat(value.length);
  return `${value.slice(0, 3)}${'*'.repeat(Math.max(4, value.length - 6))}${value.slice(-3)}`;
}

export function normalizeResponse(ok: boolean, data: unknown, message: string) {
  return { status: ok, data: data ?? {}, message };
}

export function interpolateTemplate(template: Record<string, unknown> | null, payload: Record<string, unknown>) {
  if (!template) return {};
  return JSON.parse(JSON.stringify(template).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const value = path.split('.').reduce((acc: any, segment: string) => acc?.[segment], payload);
    return value == null ? '' : String(value);
  }));
}

export function validateSchema(value: any, schema: any): { valid: boolean; errors: string[] } {
  if (!schema) return { valid: true, errors: [] };
  const errors: string[] = [];

  const getType = (input: unknown) => {
    if (Array.isArray(input)) return 'array';
    if (input === null) return 'null';
    return typeof input;
  };

  const validateNode = (nodeValue: any, nodeSchema: any, path: string) => {
    if (!nodeSchema) return;

    const expectedType = nodeSchema.type;
    if (expectedType) {
      const actualType = getType(nodeValue);
      if (actualType !== expectedType) {
        errors.push(`Invalid type for ${path}: expected ${expectedType}, got ${actualType}`);
        return;
      }
    }

    if (nodeSchema.enum && Array.isArray(nodeSchema.enum) && !nodeSchema.enum.includes(nodeValue)) {
      errors.push(`Invalid value for ${path}: expected one of ${nodeSchema.enum.join(', ')}`);
    }

    if (typeof nodeValue === 'string') {
      if (typeof nodeSchema.minLength === 'number' && nodeValue.length < nodeSchema.minLength) {
        errors.push(`String too short for ${path}: minimum ${nodeSchema.minLength}`);
      }
      if (typeof nodeSchema.maxLength === 'number' && nodeValue.length > nodeSchema.maxLength) {
        errors.push(`String too long for ${path}: maximum ${nodeSchema.maxLength}`);
      }
      if (nodeSchema.pattern) {
        const regex = new RegExp(String(nodeSchema.pattern));
        if (!regex.test(nodeValue)) {
          errors.push(`String pattern mismatch for ${path}`);
        }
      }
    }

    if (typeof nodeValue === 'number') {
      if (typeof nodeSchema.minimum === 'number' && nodeValue < nodeSchema.minimum) {
        errors.push(`Number too small for ${path}: minimum ${nodeSchema.minimum}`);
      }
      if (typeof nodeSchema.maximum === 'number' && nodeValue > nodeSchema.maximum) {
        errors.push(`Number too large for ${path}: maximum ${nodeSchema.maximum}`);
      }
    }

    if (Array.isArray(nodeValue)) {
      if (typeof nodeSchema.minItems === 'number' && nodeValue.length < nodeSchema.minItems) {
        errors.push(`Array too short for ${path}: minimum ${nodeSchema.minItems}`);
      }
      if (typeof nodeSchema.maxItems === 'number' && nodeValue.length > nodeSchema.maxItems) {
        errors.push(`Array too long for ${path}: maximum ${nodeSchema.maxItems}`);
      }
      if (nodeSchema.items) {
        nodeValue.forEach((item, index) => validateNode(item, nodeSchema.items, `${path}[${index}]`));
      }
      return;
    }

    if (nodeValue && typeof nodeValue === 'object') {
      const required = Array.isArray(nodeSchema.required) ? nodeSchema.required : [];
      const properties = nodeSchema.properties || {};

      for (const field of required) {
        if (nodeValue[field] === undefined || nodeValue[field] === null || nodeValue[field] === '') {
          errors.push(`Missing required field: ${path}.${field}`);
        }
      }

      if (nodeSchema.additionalProperties === false) {
        const allowed = new Set(Object.keys(properties));
        Object.keys(nodeValue).forEach((key) => {
          if (!allowed.has(key)) {
            errors.push(`Unexpected field ${path}.${key}`);
          }
        });
      }

      for (const [field, rule] of Object.entries(properties)) {
        if (nodeValue[field] === undefined || nodeValue[field] === null) continue;
        validateNode(nodeValue[field], rule, `${path}.${field}`);
      }
    }
  };

  validateNode(value, schema, '$');
  return { valid: errors.length === 0, errors };
}

export function computeHealthScore(input: { successRate: number; avgLatencyMs: number; costPerRequest: number; priority: number }) {
  const successComponent = Math.max(0, Math.min(100, input.successRate));
  const latencyPenalty = Math.min(40, input.avgLatencyMs / 100);
  const costPenalty = Math.min(20, input.costPerRequest * 100);
  const priorityBoost = Math.max(0, 20 - input.priority / 10);
  return Math.max(0, Math.min(100, Number((successComponent - latencyPenalty - costPenalty + priorityBoost).toFixed(2))));
}

export function sortProviders<T extends { health_score?: number | null; success_rate?: number | null; avg_latency_ms?: number | null; cost_per_request?: number | null; priority?: number | null }>(providers: T[]) {
  return [...providers].sort((left, right) => {
    const leftScore = computeHealthScore({
      successRate: Number(left.success_rate ?? 100),
      avgLatencyMs: Number(left.avg_latency_ms ?? 0),
      costPerRequest: Number(left.cost_per_request ?? 0),
      priority: Number(left.priority ?? 100),
    });
    const rightScore = computeHealthScore({
      successRate: Number(right.success_rate ?? 100),
      avgLatencyMs: Number(right.avg_latency_ms ?? 0),
      costPerRequest: Number(right.cost_per_request ?? 0),
      priority: Number(right.priority ?? 100),
    });
    return rightScore - leftScore;
  });
}

export function isCircuitOpen(provider: { circuit_state?: string | null; circuit_open_until?: string | null }) {
  if (provider.circuit_state !== 'open') return false;
  if (!provider.circuit_open_until) return true;
  return new Date(provider.circuit_open_until).getTime() > Date.now();
}

export function rotationDue(provider: { last_rotated_at?: string | null; rotate_after_days?: number | null }) {
  const rotateAfterDays = Number(provider.rotate_after_days ?? 90);
  const rotatedAt = provider.last_rotated_at ? new Date(provider.last_rotated_at).getTime() : 0;
  return !rotatedAt || Date.now() - rotatedAt > rotateAfterDays * 24 * 60 * 60 * 1000;
}

export async function waitWithBackoff(attempt: number, baseDelay = 300) {
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 5000) + Math.floor(Math.random() * 150);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Phase 2: Advanced Enterprise Controls

export function generateTraceId(tenantId: string, service: string, action: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 11);
  const hash = tenantId.slice(0, 4) + service.slice(0, 3) + action.slice(0, 3);
  return `trace-${timestamp}-${hash}-${random}`.toLowerCase();
}

export function redactPayload(payload: any, fieldsToRedact: string[], redactionType: string = 'mask'): any {
  if (!payload || !fieldsToRedact.length) return payload;
  
  const redact = (obj: any, depth = 0): any => {
    if (depth > 10 || !obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => redact(item, depth + 1));
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (fieldsToRedact.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        if (redactionType === 'mask' && typeof value === 'string') {
          result[key] = value.length > 6 ? value.slice(0, 3) + '*'.repeat(Math.max(4, value.length - 6)) + value.slice(-3) : '*'.repeat(value.length);
        } else if (redactionType === 'hash' && typeof value === 'string') {
          result[key] = '***hash***';
        } else if (redactionType === 'remove') {
          continue;
        } else {
          result[key] = '***redacted***';
        }
      } else {
        result[key] = typeof value === 'object' ? redact(value, depth + 1) : value;
      }
    }
    return result;
  };
  
  return redact(payload);
}

export function adaptiveTimeoutCalculation(
  baseTimeoutMs: number,
  avgLatencyMs: number,
  timeoutIncreaseCount: number,
): number {
  const maxIncrease = 5000;
  const increasePerAttempt = 2000;
  const increase = Math.min(timeoutIncreaseCount * increasePerAttempt, maxIncrease);
  const suggested = baseTimeoutMs + increase;
  const adaptive = Math.max(suggested, avgLatencyMs * 2);
  return Math.min(adaptive, baseTimeoutMs + maxIncrease);
}

export function costAwareRouting(
  providers: Array<{ cost_per_request?: number; success_rate?: number; health_score?: number }>,
  costThreshold?: number,
): Array<{ cost_per_request?: number; success_rate?: number; health_score?: number }> {
  if (!providers.length) return [];
  
  const maxCost = Math.max(...providers.map((p) => Number(p.cost_per_request ?? 0)));
  const threshold = costThreshold ?? maxCost * 0.8;
  
  return providers
    .filter((p) => Number(p.cost_per_request ?? 0) <= threshold)
    .sort((a, b) => {
      const costDiff = Number(a.cost_per_request ?? 0) - Number(b.cost_per_request ?? 0);
      if (Math.abs(costDiff) > 0.001) return costDiff;
      return Number(b.health_score ?? 0) - Number(a.health_score ?? 0);
    });
}

export function geoNearestEndpoint(
  endpoints: Array<{ region: string; latency_ms_average?: number; is_healthy?: boolean }>,
  userRegion?: string,
): Array<{ region: string; latency_ms_average?: number; is_healthy?: boolean }> {
  if (!userRegion || !endpoints.length) return endpoints.filter((e) => e.is_healthy !== false);
  
  const regionPriority: Record<string, number> = {
    [userRegion]: 0,
  };
  
  const neighbors: Record<string, string[]> = {
    'us-east': ['us-west', 'ca-central'],
    'us-west': ['us-east', 'ca-central'],
    'eu-west': ['eu-central', 'uk'],
    'ap-south': ['ap-southeast', 'ap-northeast'],
  };
  
  (neighbors[userRegion] || []).forEach((region, idx) => {
    regionPriority[region] = idx + 1;
  });
  
  return endpoints
    .filter((e) => e.is_healthy !== false)
    .sort((a, b) => {
      const priorityDiff = (regionPriority[a.region] ?? 999) - (regionPriority[b.region] ?? 999);
      if (priorityDiff !== 0) return priorityDiff;
      return Number(a.latency_ms_average ?? 0) - Number(b.latency_ms_average ?? 0);
    });
}

export function validatePolicy(
  policy: { policy_type: string; conditions?: any; actions?: string[]; service_types?: string[] },
  service: string,
  action: string,
  requestData?: any,
): { allowed: boolean; reason?: string } {
  if (policy.service_types && !policy.service_types.includes(service)) {
    return { allowed: policy.policy_type === 'allow', reason: `Service ${service} not in policy` };
  }
  
  if (policy.policy_type === 'allow') return { allowed: true };
  if (policy.policy_type === 'deny') return { allowed: false, reason: 'Denied by policy' };
  
  if (policy.policy_type === 'rate_limit' && policy.conditions?.max_per_minute) {
    return { allowed: true };
  }
  
  if (policy.policy_type === 'cost_limit' && policy.conditions?.max_amount) {
    return { allowed: true };
  }
  
  return { allowed: true };
}

// Phase 3: Production Chaos Mitigation

export function enforceReplayProtection(
  idempotencyKey: string,
  provider: string,
  requestHash: string,
  existingRecord?: { seen_at: string; expires_at: string }
): { protected: boolean; reason?: string } {
  if (!idempotencyKey) return { protected: false, reason: 'No idempotency key' };
  
  if (existingRecord) {
    const isExpired = new Date(existingRecord.expires_at).getTime() <= Date.now();
    if (!isExpired) {
      return { protected: true, reason: 'Replay detected and blocked' };
    }
  }
  
  return { protected: false };
}

export function checkSLABreach(
  latencyMs: number,
  successRate: number,
  slaTargets?: { max_latency_ms?: number; min_success_rate?: number }
): { breached: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  if (slaTargets?.max_latency_ms && latencyMs > slaTargets.max_latency_ms) {
    reasons.push(`Latency ${latencyMs}ms exceeds SLA ${slaTargets.max_latency_ms}ms`);
  }
  
  if (slaTargets?.min_success_rate && successRate < slaTargets.min_success_rate) {
    reasons.push(`Success rate ${successRate}% below SLA ${slaTargets.min_success_rate}%`);
  }
  
  return { breached: reasons.length > 0, reasons };
}

export function applyCostCutoff(
  tenantBudget: number,
  tenantUsed: number,
  costThreshold: number = 0.9
): { cutoffTriggered: boolean; percentUsed: number } {
  const percentUsed = tenantBudget > 0 ? (tenantUsed / tenantBudget) * 100 : 0;
  const cutoffTriggered = percentUsed >= costThreshold * 100;
  
  return { cutoffTriggered, percentUsed };
}

export function applySandboxIsolation(
  sandboxMode: boolean,
  provider?: { sandbox_api_key?: any; api_key?: any; environment?: string }
): { isolated: boolean; reason?: string } {
  if (sandboxMode && !provider?.sandbox_api_key && !provider?.api_key) {
    return { isolated: false, reason: 'Sandbox mode requested but no sandbox keys configured' };
  }
  
  if (!sandboxMode && provider?.environment === 'sandbox') {
    return { isolated: false, reason: 'Provider configured for sandbox only; live mode requested' };
  }
  
  return { isolated: true };
}

export function checkDataResidency(
  userRegion: string,
  allowedRegions: string[],
  restrictedProviders: string[],
  providerName: string
): { allowed: boolean; reason?: string } {
  if (restrictedProviders.includes(providerName)) {
    return { allowed: false, reason: `Provider ${providerName} restricted by residency rules` };
  }
  
  if (allowedRegions.length > 0 && !allowedRegions.includes(userRegion)) {
    return { allowed: false, reason: `Region ${userRegion} not in allowed list: ${allowedRegions.join(',')}` };
  }
  
  return { allowed: true };
}

export function shouldShadowTraffic(
  shadowJobs: Array<{ traffic_percentage: number; status: string }>,
  randomValue: number = Math.random()
): { shadowEnabled: boolean; shadowJobId?: string } {
  const activeJob = shadowJobs.find((job) => job.status === 'running' && job.traffic_percentage > 0);
  
  if (!activeJob) return { shadowEnabled: false };
  
  const shouldShadow = randomValue * 100 < activeJob.traffic_percentage;
  return { shadowEnabled: shouldShadow };
}

export function checkIncidentMode(
  featureFlags: Array<{ flag_name: string; is_enabled: boolean; config?: any }>
): { incidentModeActive: boolean; limitedFeatures: string[] } {
  const incidentFlag = featureFlags.find((f) => f.flag_name === 'incident_mode' && f.is_enabled);
  
  if (!incidentFlag) return { incidentModeActive: false, limitedFeatures: [] };
  
  const limitedFeatures = incidentFlag.config?.limited_features ?? [
    'bulk_execution',
    'shadow_traffic',
    'advanced_routing',
  ];
  
    return { incidentModeActive: true, limitedFeatures };
  }

// ============================================================
// PHASE 4: OPERATIONAL INFRASTRUCTURE HARDENING (12 CONTROLS)
// ============================================================

// 1. DEADLINE PROPAGATION
export function enforceDeadlinePropagation(
  maxTimeMs: number,
  startTimeMs: number = Date.now(),
  currentConsumedMs: number = 0
): { remaining: number; exceeded: boolean; deadline: number } {
  const elapsed = Date.now() - startTimeMs + currentConsumedMs;
  const remaining = maxTimeMs - elapsed;
  const exceeded = remaining <= 0;
  return { remaining: Math.max(0, remaining), exceeded, deadline: startTimeMs + maxTimeMs };
}

// 2. PRIORITY QUEUE SELECTION
export function selectPriorityQueue(
  requestType: string,
  isPaymentRequest: boolean = false
): { queueName: string; priority: number } {
  if (isPaymentRequest) return { queueName: 'payment_critical', priority: 1 };
  if (requestType === 'webhook') return { queueName: 'webhook_normal', priority: 5 };
  if (requestType === 'analytics') return { queueName: 'analytics_batch', priority: 9 };
  return { queueName: 'default_normal', priority: 5 };
}

// 3. BACKPRESSURE CONTROL
export function applyBackpressure(
  currentQueueDepth: number,
  rpsLimit: number,
  concurrentLimit: number,
  queueThreshold: number
): { shouldBackpressure: boolean; shouldReject: boolean; waitMs?: number; reason?: string } {
  if (currentQueueDepth > queueThreshold) {
    return { shouldBackpressure: true, shouldReject: true, reason: `Queue depth ${currentQueueDepth} exceeds threshold ${queueThreshold}` };
  }
  const estimatedWait = (currentQueueDepth / rpsLimit) * 1000;
  if (estimatedWait > 5000) {
    return { shouldBackpressure: true, shouldReject: false, waitMs: Math.min(estimatedWait, 5000), reason: 'High load detected' };
  }
  return { shouldBackpressure: false, shouldReject: false };
}

// 4. ADAPTIVE CONCURRENCY
export function adjustAdaptiveConcurrency(
  currentLimit: number,
  successRate: number,
  avgLatencyMs: number,
  minLimit: number,
  maxLimit: number,
  rampUpRate: number = 1.1,
  rampDownRate: number = 0.9,
  successThreshold: number = 90.0,
  latencyThreshold: number = 1000
): { newLimit: number; direction: 'up' | 'down' | 'stable'; reason: string } {
  if (successRate < successThreshold) {
    const newLimit = Math.max(minLimit, Math.floor(currentLimit * rampDownRate));
    return { newLimit, direction: 'down', reason: `Low success rate: ${successRate.toFixed(1)}%` };
  }
  if (avgLatencyMs > latencyThreshold) {
    const newLimit = Math.max(minLimit, Math.floor(currentLimit * rampDownRate));
    return { newLimit, direction: 'down', reason: `High latency: ${avgLatencyMs}ms` };
  }
  if (successRate >= successThreshold && avgLatencyMs <= latencyThreshold) {
    const newLimit = Math.min(maxLimit, Math.ceil(currentLimit * rampUpRate));
    return { newLimit, direction: 'up', reason: 'Good performance metrics' };
  }
  return { newLimit: currentLimit, direction: 'stable', reason: 'No adjustment needed' };
}

// 5. CONNECTION POOL ACQUISITION
export function acquireFromConnectionPool(
  minPoolSize: number,
  maxPoolSize: number,
  currentConnections: number,
  idleConnections: number
): { canAcquire: boolean; connectionId?: string; waitMs?: number; reason?: string } {
  if (idleConnections > 0) {
    return { canAcquire: true, connectionId: crypto.randomUUID(), waitMs: 0 };
  }
  if (currentConnections < maxPoolSize) {
    return { canAcquire: true, connectionId: crypto.randomUUID(), waitMs: 50, reason: 'Creating new connection' };
  }
  return { canAcquire: false, waitMs: 100, reason: `Pool exhausted (max ${maxPoolSize})` };
}

// 6. TLS PINNING VERIFICATION
export function verifyTLSPin(
  certificateSha256: string,
  expectedSha256: string,
  backupSha256?: string
): { verified: boolean; pinned: boolean; reason?: string } {
  if (certificateSha256 === expectedSha256) {
    return { verified: true, pinned: true };
  }
  if (backupSha256 && certificateSha256 === backupSha256) {
    return { verified: true, pinned: true, reason: 'Verified against backup pin' };
  }
  return { verified: false, pinned: false, reason: `Certificate mismatch: ${certificateSha256} vs ${expectedSha256}` };
}

// 7. HEADER NORMALIZATION
export function normalizeHeaders(
  incomingHeaders: Record<string, string>,
  rules: Array<{ source: string; target: string; transformation: string }>
): { normalized: Record<string, string>; errors: string[] } {
  const errors: string[] = [];
  const normalized: Record<string, string> = {};

  rules.forEach((rule) => {
    const value = incomingHeaders[rule.source];
    if (!value && rule.transformation !== 'optional') {
      errors.push(`Missing required header: ${rule.source}`);
      return;
    }

    let transformed = value || '';
    if (rule.transformation === 'lowercase') transformed = transformed.toLowerCase();
    if (rule.transformation === 'uppercase') transformed = transformed.toUpperCase();
    if (rule.transformation === 'base64_encode') transformed = btoa(transformed);

    normalized[rule.target] = transformed;
  });

  return { normalized, errors };
}

// 8. RESPONSE PARTIAL PARSING (STREAMING DECISION)
export function shouldStreamResponse(
  contentLengthBytes: number,
  acceptsChunked: boolean,
  streamThresholdBytes: number = 1048576
): { stream: boolean; chunkSize?: number; reason: string } {
  if (!acceptsChunked) {
    return { stream: false, reason: 'Client does not accept chunked transfer' };
  }
  if (contentLengthBytes > streamThresholdBytes) {
    const chunkSize = Math.min(65536, Math.floor(contentLengthBytes / 10));
    return { stream: true, chunkSize, reason: `Large payload (${contentLengthBytes} bytes)` };
  }
  return { stream: false, reason: 'Payload below streaming threshold' };
}

// 9. CLOCK SKEW CORRECTION
export function correctClockSkew(
  remoteTimestampMs: number,
  offsetMs: number = 0,
  maxCorrectionMs: number = 5000
): { corrected: boolean; adjustedTime: number; skewDetected: number } {
  const localNow = Date.now();
  const skew = remoteTimestampMs - localNow + offsetMs;
  const absDrift = Math.abs(skew);

  if (absDrift > maxCorrectionMs) {
    return { corrected: false, adjustedTime: localNow, skewDetected: skew };
  }

  return { corrected: true, adjustedTime: remoteTimestampMs + offsetMs, skewDetected: skew };
}

// 10. IDEMPOTENT WEBHOOK DEDUPLICATION
export function deduplicateWebhookEvent(
  eventId: string,
  payloadHash: string,
  lastSeenAt?: string
): { isDuplicate: boolean; shouldProcess: boolean; reason?: string } {
  if (!eventId) {
    return { isDuplicate: false, shouldProcess: true, reason: 'No event_id provided, processing' };
  }

  if (lastSeenAt) {
    const lastSeenTime = new Date(lastSeenAt).getTime();
    const oneHourAgo = Date.now() - 3600000;
    if (lastSeenTime > oneHourAgo) {
      return { isDuplicate: true, shouldProcess: false, reason: 'Duplicate event detected within 1 hour' };
    }
  }

  return { isDuplicate: false, shouldProcess: true };
}

// 11. RETRY BUDGET ENFORCEMENT
export function enforceRetryBudget(
  retriesUsed: number,
  maxRetriesPerRequest: number,
  totalRetriesThisMinute: number,
  maxTotalRetriesPerMinute: number,
  costWeight: number = 1.0
): { canRetry: boolean; budgetExceeded: boolean; reason?: string } {
  const requestBudgetRemaining = maxRetriesPerRequest - retriesUsed;
  if (requestBudgetRemaining <= 0) {
    return { canRetry: false, budgetExceeded: true, reason: `Request retry limit reached (${maxRetriesPerRequest} retries)` };
  }

  const minuteBudgetRemaining = maxTotalRetriesPerMinute - (totalRetriesThisMinute * costWeight);
  if (minuteBudgetRemaining <= 0) {
    return { canRetry: false, budgetExceeded: true, reason: `Minute retry budget exhausted` };
  }

  return { canRetry: true, budgetExceeded: false, reason: `${requestBudgetRemaining} retries remaining` };
}

// 12. GRACEFUL DEGRADATION
export function shouldDegradeGracefully(
  componentFailing: string,
  criticality: 'critical' | 'semi_critical' | 'non_critical',
  consecutiveFailures: number,
  maxConsecutiveFailures: number
): { shouldDegrade: boolean; action: 'continue' | 'fallback' | 'queue' | 'circuit_break'; reason: string } {
  if (criticality === 'critical') {
    return { shouldDegrade: false, action: 'circuit_break', reason: 'Critical component must not degrade' };
  }

  if (consecutiveFailures >= maxConsecutiveFailures && criticality === 'semi_critical') {
    return { shouldDegrade: true, action: 'fallback', reason: `${consecutiveFailures} consecutive failures, switching to fallback` };
  }

  if (criticality === 'non_critical') {
    return { shouldDegrade: true, action: 'continue', reason: 'Non-critical component failure, continuing core flow' };
  }

  return { shouldDegrade: true, action: 'queue', reason: 'Component temporarily unavailable, queueing for retry' };
}

