const LEGACY_REFERENCE_PATTERN = /(^|[\/_\-.])(legacy|old)([\/_\-.]|$)/i;

function normalizeMode(value: unknown): string {
  return String(value || '').trim().toUpperCase();
}

export function isLegacyReference(value: string): boolean {
  return LEGACY_REFERENCE_PATTERN.test(String(value || ''));
}

export function assertNoLegacyReference(value: string, label: string): void {
  if (isLegacyReference(value)) {
    throw new Error(`NEW_ONLY violation: legacy reference blocked for ${label}=${value}`);
  }
}

export function assertNewOnlyModeServer(): void {
  const mode = normalizeMode(process.env.SYSTEM_MODE);
  if (mode !== 'NEW_ONLY') {
    throw new Error(`NEW_ONLY violation: SYSTEM_MODE must be NEW_ONLY, got ${mode || '<missing>'}`);
  }

  if (normalizeMode(process.env.ALLOW_LEGACY_DB) === 'TRUE') {
    throw new Error('NEW_ONLY violation: ALLOW_LEGACY_DB=true is forbidden');
  }

  if (normalizeMode(process.env.ALLOW_LEGACY_API) === 'TRUE') {
    throw new Error('NEW_ONLY violation: ALLOW_LEGACY_API=true is forbidden');
  }
}

export function assertNewOnlyModeRuntime(modeValue: unknown, allowLegacyApiValue: unknown): void {
  const mode = normalizeMode(modeValue);
  if (mode !== 'NEW_ONLY') {
    throw new Error(`NEW_ONLY violation: VITE_SYSTEM_MODE must be NEW_ONLY, got ${mode || '<missing>'}`);
  }

  if (normalizeMode(allowLegacyApiValue) === 'TRUE') {
    throw new Error('NEW_ONLY violation: VITE_ALLOW_LEGACY_API=true is forbidden');
  }
}
