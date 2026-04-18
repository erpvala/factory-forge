// @ts-nocheck

const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /secret/i,
  /wallet/i,
  /phone/i,
  /email/i,
];

const MASK = '***MASKED***';

const isSensitiveField = (key: string) => SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(key));

export const maskSensitiveValue = (value: unknown) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (value.length <= 4) return MASK;
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }
  if (typeof value === 'number') return MASK;
  return MASK;
};

export const sanitizeLogPayload = (payload: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload || {})) {
    if (isSensitiveField(key)) {
      out[key] = maskSensitiveValue(value);
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = sanitizeLogPayload(value as Record<string, unknown>);
      continue;
    }

    if (Array.isArray(value)) {
      out[key] = value.map((entry) => {
        if (entry && typeof entry === 'object') {
          return sanitizeLogPayload(entry as Record<string, unknown>);
        }
        return entry;
      });
      continue;
    }

    out[key] = value;
  }

  return out;
};

export const maskSensitiveFields = (
  payload: Record<string, unknown>,
  allowedSensitiveFields: string[] = [],
) => {
  const allowed = new Set((allowedSensitiveFields || []).map((field) => field.toLowerCase()));
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload || {})) {
    if (isSensitiveField(key) && !allowed.has(key.toLowerCase())) {
      out[key] = maskSensitiveValue(value);
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = maskSensitiveFields(value as Record<string, unknown>, allowedSensitiveFields);
      continue;
    }

    out[key] = value;
  }

  return out;
};

export const filterFieldsByRole = (
  payload: Record<string, unknown>,
  allowedFields: string[],
) => {
  const allowed = new Set(allowedFields || []);
  return Object.fromEntries(Object.entries(payload || {}).filter(([key]) => allowed.has(key)));
};
