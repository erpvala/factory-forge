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
    const messageId = `msg_${Date.now()}`;

    await EventBus.create({
      eventType: 'assist_message',
      source: 'assist',
      data: {
        id: messageId,
        message: String(body.message || ''),
        tenant_id: session.tenant_id,
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      chat: {
        id: messageId,
        user_id: session.user_id,
        message: String(body.message || ''),
        created_at: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'assist_message_failed' }, { status: 401 });
  }
}
