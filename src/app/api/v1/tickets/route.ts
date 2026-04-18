import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';
import { triggerGlobalHooksAsync } from '@/lib/hooks/globalHookSystem';
import connectToDatabase from '@/lib/database';
import EventBus from '@/models/EventBus';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    const body = await request.json();
    const ticketId = `tkt_${Date.now()}`;
    await connectToDatabase();

    await EventBus.create({
      eventType: 'ticket_created',
      source: 'support',
      data: {
        ticket_id: ticketId,
        subject: String(body.subject || 'support'),
        message: String(body.message || ''),
        status: 'open',
        tenant_id: session.tenant_id,
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    triggerGlobalHooksAsync({
      event: 'ticket_created',
      module: 'support',
      payload: {
        ticket_id: ticketId,
        user_id: session.user_id,
        subject: body.subject || 'support',
      },
      hookType: 'post_action_hook',
    });

    return NextResponse.json({ success: true, ticket: { id: ticketId, status: 'open' } });
  } catch {
    return NextResponse.json({ success: false, error: 'ticket_create_failed' }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    const body = await request.json();
    const ticketId = String(body.ticket_id || `tkt_${Date.now()}`);
    await connectToDatabase();

    await EventBus.create({
      eventType: 'ticket_resolved',
      source: 'support',
      data: {
        ticket_id: ticketId,
        resolution: String(body.resolution || 'resolved'),
        status: 'resolved',
        tenant_id: session.tenant_id,
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    triggerGlobalHooksAsync({
      event: 'ticket_resolved',
      module: 'support',
      payload: {
        ticket_id: ticketId,
        status: 'resolved',
      },
      hookType: 'post_action_hook',
    });

    return NextResponse.json({ success: true, ticket: { id: ticketId, status: 'resolved' } });
  } catch {
    return NextResponse.json({ success: false, error: 'ticket_resolve_failed' }, { status: 401 });
  }
}
