import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireRole, requireTenant } from '@/lib/api/sessionAuth';
import { enqueueDeliveryJob, getDeliveryJobs } from '@/lib/queue/deliveryQueue';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin', 'support']);
    return NextResponse.json({ success: true, jobs: getDeliveryJobs(200) });
  } catch {
    return NextResponse.json({ success: false, error: 'delivery_jobs_unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin']);
    const body = await request.json();
    const job = enqueueDeliveryJob({
      order_id: String(body.order_id || `ord_${Date.now()}`),
      user_id: String(body.user_id || session.user_id),
      product_id: String(body.product_id || ''),
      trace_id: String(body.trace_id || ''),
    });
    return NextResponse.json({ success: true, job });
  } catch {
    return NextResponse.json({ success: false, error: 'delivery_enqueue_failed' }, { status: 401 });
  }
}
