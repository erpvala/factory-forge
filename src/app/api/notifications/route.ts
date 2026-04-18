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
      eventType: 'notification_event',
      source: 'notifications',
      data: {
        title: String(body.title || 'Notification'),
        message: String(body.message || ''),
        target_user_id: String(body.target_user_id || session.user_id),
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, id: event._id, pushed: true });
  } catch {
    return NextResponse.json({ success: false, error: 'notification_insert_failed' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    await connectToDatabase();
    const limit = Math.max(1, Math.min(200, Number(new URL(request.url).searchParams.get('limit') || '200')));
    const notifications = await EventBus.find({
      eventType: 'notification_event',
      'data.target_user_id': session.user_id,
    })
      .sort({ timestamp: -1 })
      .limit(limit);
    return NextResponse.json({ success: true, notifications });
  } catch {
    return NextResponse.json({ success: false, error: 'notification_fetch_failed' }, { status: 400 });
  }
}
