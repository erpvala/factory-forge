import { z } from 'zod';

export type SchemaVersion = 'v1' | 'v2' | 'v3';

const VERSION_ORDER: SchemaVersion[] = ['v1', 'v2', 'v3'];

const BaseRequestSchema = z.object({
  trace_id: z.string().min(8).optional(),
  idempotency_key: z.string().min(8).optional(),
});

const BaseResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

const ModuleContractMap: Record<string, { requestSchema: z.ZodTypeAny; responseSchema: z.ZodTypeAny }> = {
  marketplace: {
    requestSchema: BaseRequestSchema.extend({
      action: z.string().min(1).optional(),
    }).passthrough(),
    responseSchema: BaseResponseSchema,
  },
  finance: {
    requestSchema: BaseRequestSchema.passthrough(),
    responseSchema: BaseResponseSchema,
  },
  platform: {
    requestSchema: BaseRequestSchema.passthrough(),
    responseSchema: BaseResponseSchema,
  },
};

function toVersion(value: string | undefined | null): SchemaVersion {
  const normalized = String(value || 'v1').toLowerCase();
  if (normalized === 'v2') return 'v2';
  if (normalized === 'v3') return 'v3';
  return 'v1';
}

function compareVersion(a: SchemaVersion, b: SchemaVersion): number {
  return VERSION_ORDER.indexOf(a) - VERSION_ORDER.indexOf(b);
}

export function resolveSchemaCompatibility(params: {
  moduleKey: string;
  serverVersion: string;
  requestedVersion?: string;
  deprecateAfter?: string | null;
}): { acceptedVersion: SchemaVersion; forceUpgrade: boolean; reason?: string } {
  const serverVersion = toVersion(params.serverVersion);
  const requestedVersion = toVersion(params.requestedVersion || params.serverVersion);

  if (params.deprecateAfter) {
    const deadline = Date.parse(params.deprecateAfter);
    if (!Number.isNaN(deadline) && Date.now() >= deadline && compareVersion(requestedVersion, serverVersion) < 0) {
      return {
        acceptedVersion: serverVersion,
        forceUpgrade: true,
        reason: `schema_deprecated:${params.moduleKey}:${requestedVersion}->${serverVersion}`,
      };
    }
  }

  const compatibilityWindow = Number(import.meta.env.VITE_SCHEMA_BACKCOMPAT_MINORS || '1');
  const distance = Math.abs(compareVersion(serverVersion, requestedVersion));

  if (requestedVersion === serverVersion) {
    return { acceptedVersion: serverVersion, forceUpgrade: false };
  }

  if (compareVersion(requestedVersion, serverVersion) < 0 && distance <= compatibilityWindow) {
    return { acceptedVersion: requestedVersion, forceUpgrade: false };
  }

  return {
    acceptedVersion: serverVersion,
    forceUpgrade: true,
    reason: `schema_version_mismatch:${params.moduleKey}:requested=${requestedVersion}:server=${serverVersion}`,
  };
}

export function assertContractRequest(moduleKey: string, payload: unknown): void {
  const contract = ModuleContractMap[moduleKey] || ModuleContractMap.platform;
  const result = contract.requestSchema.safeParse(payload || {});
  if (!result.success) {
    throw new Error(`contract_request_invalid:${moduleKey}:${result.error.issues[0]?.message || 'unknown'}`);
  }
}

export function assertContractResponse(moduleKey: string, payload: unknown): void {
  const contract = ModuleContractMap[moduleKey] || ModuleContractMap.platform;
  const result = contract.responseSchema.safeParse(payload || {});
  if (!result.success) {
    throw new Error(`contract_response_invalid:${moduleKey}:${result.error.issues[0]?.message || 'unknown'}`);
  }
}
