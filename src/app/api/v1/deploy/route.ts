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
    const deployId = `dep_${Date.now()}`;

    await EventBus.create({
      eventType: 'deploy_queued',
      source: 'developer',
      data: {
        deploy_id: deployId,
        project_id: String(body.project_id || ''),
        status: 'queued',
        tenant_id: session.tenant_id,
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      deploy: {
        id: deployId,
        user_id: session.user_id,
        project_id: String(body.project_id || ''),
        status: 'queued',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'deploy_failed' }, { status: 401 });
  }
}
