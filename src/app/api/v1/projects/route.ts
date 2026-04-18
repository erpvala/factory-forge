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
    const projectId = `prj_${Date.now()}`;

    await EventBus.create({
      eventType: 'project_created',
      source: 'developer',
      data: {
        project_id: projectId,
        name: String(body.name || 'untitled-project'),
        tenant_id: session.tenant_id,
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      project: {
        id: projectId,
        owner: session.user_id,
        name: String(body.name || 'untitled-project'),
        created_at: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'project_create_failed' }, { status: 401 });
  }
}
