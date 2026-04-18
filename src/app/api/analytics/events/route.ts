import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';
import EventBus from '@/models/EventBus';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    const body = await request.json();
    await connectToDatabase();

    const event = await EventBus.create({
      eventType: String(body.eventType || 'analytics_event'),
      source: 'analytics',
      data: body.data || {},
      userId: session.user_id,
      sessionId: body.session_id || null,
      processed: false,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, id: event._id });
  } catch {
    return NextResponse.json({ success: false, error: 'analytics_event_insert_failed' }, { status: 400 });
  }
}
