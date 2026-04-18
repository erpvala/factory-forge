import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import EventBus from '@/models/EventBus';
import { getSessionFromRequest, requireRole, requireTenant, type SessionShape } from '@/lib/api/sessionAuth';
import { CONTROL_PANEL_MODULES } from '@/config/controlPanelModules';
import { triggerGlobalHooks } from '@/lib/hooks/globalHookSystem';

const ACTION_STATUS_MAP: Record<string, string> = {
  start: 'active',
  startai: 'active',
  resume: 'active',
  stop: 'stopped',
  stopai: 'stopped',
  pause: 'pending',
  update: 'active',
  edit: 'active',
  view: 'active',
};

type ModuleDefinition = {
  id: string;
  path: string;
  apiBase: string;
  dbTable: string;
  allowedRoles: string[];
};

function getModuleOrThrow(moduleId: string): ModuleDefinition {
  const moduleDef = CONTROL_PANEL_MODULES.find((item) => item.id === moduleId);
  if (!moduleDef) {
    throw new Error(`module_not_registered:${moduleId}`);
  }
  return moduleDef;
}

export async function createModuleActionRecord(input: {
  session: SessionShape;
  moduleId: string;
  action: string;
  payload?: Record<string, unknown>;
  eventType?: string;
  metadata?: Record<string, unknown>;
}) {
  await connectToDatabase();

  const eventType = input.eventType || 'control_panel_action';
  const action = String(input.action || 'unknown').trim().toLowerCase();
  const created = await EventBus.create({
    eventType,
    source: input.moduleId,
    data: {
      action,
      status: ACTION_STATUS_MAP[action] || 'active',
      module_id: input.moduleId,
      tenant_id: input.session.tenant_id,
      user_id: input.session.user_id,
      payload: input.payload || {},
      ...(input.metadata || {}),
    },
    userId: input.session.user_id,
    processed: false,
    timestamp: new Date(),
  });

  let hookResult: { trace_id: string; executed: number } | null = null;
  let hookError: string | null = null;

  try {
    hookResult = await triggerGlobalHooks({
      event: eventType,
      module: input.moduleId,
      payload: {
        action,
        module_id: input.moduleId,
        tenant_id: input.session.tenant_id,
        user_id: input.session.user_id,
        ...(input.payload || {}),
      },
    });
  } catch (error) {
    hookError = error instanceof Error ? error.message : 'hook_trigger_failed';
  }

  return {
    id: String(created._id),
    action,
    status: ACTION_STATUS_MAP[action] || 'active',
    hook: hookResult,
    hook_error: hookError,
    created_at: new Date().toISOString(),
  };
}

export async function handleModuleGet(request: NextRequest, moduleId: string) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);

    const moduleDef = getModuleOrThrow(moduleId);
    requireRole(session, moduleDef.allowedRoles);

    await connectToDatabase();
    const records = await EventBus.find({
      source: moduleId,
      'data.tenant_id': session.tenant_id,
    })
      .sort({ timestamp: -1 })
      .limit(25)
      .lean();

    return NextResponse.json({
      success: true,
      module: {
        id: moduleDef.id,
        path: moduleDef.path,
        apiBase: moduleDef.apiBase,
        dbTable: moduleDef.dbTable,
      },
      status: records[0]?.data?.status || 'active',
      recent_actions: records.map((record) => ({
        id: String(record._id),
        event_type: record.eventType,
        action: String(record.data?.action || 'unknown'),
        status: String(record.data?.status || 'active'),
        created_at: record.timestamp,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'module_read_failed' },
      { status: 403 },
    );
  }
}

export async function handleModulePost(request: NextRequest, moduleId: string) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);

    const moduleDef = getModuleOrThrow(moduleId);
    requireRole(session, moduleDef.allowedRoles);

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      payload?: Record<string, unknown>;
    };

    const action = String(body.action || 'sync').trim().toLowerCase();
    const event = await createModuleActionRecord({
      session,
      moduleId,
      action,
      payload: body.payload || {},
    });

    return NextResponse.json({
      success: true,
      module: moduleId,
      action,
      status: event.status,
      flow: event.hook,
      flow_error: event.hook_error,
      event_id: event.id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'module_action_failed' },
      { status: 403 },
    );
  }
}
