// @ts-nocheck

export interface FieldSpec {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required?: boolean;
}

export const validateRecordSchema = (record: Record<string, unknown>, fields: FieldSpec[]) => {
  const errors: string[] = [];

  for (const field of fields) {
    const value = record[field.key];
    const missing = value === undefined || value === null;

    if (field.required && missing) {
      errors.push(`missing:${field.key}`);
      continue;
    }

    if (!missing && typeof value !== field.type) {
      errors.push(`type_mismatch:${field.key}:${typeof value}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
};

export const assertSchemaOrThrow = (moduleKey: string, payload: Record<string, unknown>, fields: FieldSpec[]) => {
  const check = validateRecordSchema(payload, fields);
  if (!check.ok) {
    const detail = {
      moduleKey,
      errors: check.errors,
      timestamp: new Date().toISOString(),
    };
    window.dispatchEvent(new CustomEvent('sv:data-sync-incident', { detail }));
    throw new Error(`Data schema mismatch for ${moduleKey}: ${check.errors.join(', ')}`);
  }
};
