import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';
import connectToDatabase from '@/lib/database';
import EventBus from '@/models/EventBus';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    const body = await request.json();
    await connectToDatabase();
    const promiseId = `prm_${Date.now()}`;

    await EventBus.create({
      eventType: 'promise_tracked',
      source: 'promises',
      data: {
        promise_id: promiseId,
        sla_minutes: Number(body.sla_minutes || 60),
        status: 'tracked',
        tenant_id: session.tenant_id,
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      promise: {
        id: promiseId,
        user_id: session.user_id,
        sla_minutes: Number(body.sla_minutes || 60),
        status: 'tracked',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'promise_create_failed' }, { status: 401 });
  }
}
