// @ts-nocheck
import { executeManagedApi } from '@/lib/ai-api-manager/client';
import type { ExecuteManagedApiInput, NormalizedApiResponse } from '@/lib/ai-api-manager/types';

// Canonical internal entry point for centralized external API execution.
// Contract target: POST /api/v1/ai-api/execute
export async function postAIApiExecute<T = unknown>(body: ExecuteManagedApiInput): Promise<NormalizedApiResponse<T>> {
  return executeManagedApi<T>(body);
}
