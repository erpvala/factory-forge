import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { getHooksRegistry, getHookJobs, getHookLogs } from '@/lib/hooks/globalHookSystem';
import { getDeliveryJobs } from '@/lib/queue/deliveryQueue';

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {
    db: { ok: false },
    hooks: { ok: false },
    queue: { ok: false },
    providers: { ok: false },
  };

  try {
    await connectToDatabase();
    checks.db = { ok: true };
  } catch (error) {
    checks.db = { ok: false, detail: error instanceof Error ? error.message : 'db_unreachable' };
  }

  try {
    checks.hooks = {
      ok: true,
      detail: JSON.stringify({
        registry: getHooksRegistry().length,
        jobs: getHookJobs(50).length,
        logs: getHookLogs(50).length,
      }),
    };
  } catch (error) {
    checks.hooks = { ok: false, detail: error instanceof Error ? error.message : 'hooks_unavailable' };
  }

  try {
    checks.queue = {
      ok: true,
      detail: JSON.stringify({ pending_jobs: getDeliveryJobs(200).length }),
    };
  } catch (error) {
    checks.queue = { ok: false, detail: error instanceof Error ? error.message : 'queue_unavailable' };
  }

  const providerOk = Boolean(process.env.SUPABASE_URL || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  checks.providers = providerOk
    ? { ok: true }
    : { ok: false, detail: 'provider_env_missing' };

  const overallOk = Object.values(checks).every((item) => item.ok);
  return NextResponse.json(
    {
      success: overallOk,
      service: 'factory-forge',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: overallOk ? 200 : 503 },
  );
}
