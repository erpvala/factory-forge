import { NextRequest, NextResponse } from 'next/server';
import { retryHookJob } from '@/lib/hooks/globalHookSystem';

export async function POST(request: NextRequest) {
  try {
    const hasAuthToken = Boolean(request.cookies.get('auth_token')?.value);
    const appSignature = request.headers.get('x-app-signature') || '';
    const expectedSignature = process.env.APP_SIGNATURE || 'a2a387182eec7c53edf651322b032f5b58247a6d8a7fd3841d4fc8ee981566e4';

    if (!hasAuthToken || appSignature !== expectedSignature) {
      return NextResponse.json({ success: false, error: 'hook_retry_unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const result = await retryHookJob(String(body.job_id || ''));
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'hook_retry_failed' },
      { status: 400 },
    );
  }
}
