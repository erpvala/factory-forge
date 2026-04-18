import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import EventBus from '@/models/EventBus';
import SystemMetrics from '@/models/SystemMetrics';
import { getSessionFromRequest, requireRole, requireTenant } from '@/lib/api/sessionAuth';
import { createModuleActionRecord } from '@/lib/api/controlPanelModuleApi';

const ACTION_MODULE_MAP: Record<string, string> = {
  run: 'health',
  pause: 'health',
  stop: 'health',
  lock: 'security-manager',
  escalate: 'hooks',
};

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin', 'security_manager']);

    const body = (await request.json().catch(() => ({}))) as { action?: string; payload?: Record<string, unknown> };
    const action = String(body.action || 'run').trim().toLowerCase();
    const moduleId = ACTION_MODULE_MAP[action] || 'health';

    await connectToDatabase();

    const actionRecord = await createModuleActionRecord({
      session,
      moduleId,
      action,
      payload: {
        ...(body.payload || {}),
        origin: 'control-panel',
      },
      eventType: 'control_panel_action',
    });

    await SystemMetrics.create({
      metricType: action === 'lock' ? 'ERRORS' : 'PERFORMANCE',
      value: action === 'lock' ? 1 : 100,
      unit: action === 'lock' ? 'lock' : 'action',
      tags: {
        action,
        moduleId,
        tenantId: session.tenant_id,
      },
      timestamp: new Date(),
    });

    const notification = await EventBus.create({
      eventType: 'notification_event',
      source: 'control-panel',
      data: {
        title: `Control Panel ${action}`,
        message: `${action} executed for ${moduleId}`,
        target_user_id: session.user_id,
        tenant_id: session.tenant_id,
      },
      userId: session.user_id,
      processed: false,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      action,
      status: actionRecord.status,
      notificationId: String(notification._id),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'control_panel_action_failed' },
      { status: 400 },
    );
  }
}