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
    const requestId = `ai_${Date.now()}`;
    const prompt = String(body.prompt || '');

    await EventBus.create({
      eventType: 'ai_request',
      source: 'ai',
      data: {
        request_id: requestId,
        provider: 'mock-provider',
        prompt_chars: prompt.length,
        tenant_id: session.tenant_id,
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      ai_response: {
        request_id: requestId,
        user_id: session.user_id,
        provider: 'mock-provider',
        output: `Processed: ${prompt}`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'ai_request_failed' }, { status: 401 });
  }
}
