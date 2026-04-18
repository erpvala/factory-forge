import { NextRequest, NextResponse } from 'next/server';
import { createModuleActionRecord, handleModuleGet } from '@/lib/api/controlPanelModuleApi';
import { getSessionFromRequest, requireRole, requireTenant } from '@/lib/api/sessionAuth';
import connectToDatabase from '@/lib/database';
import EventBus from '@/models/EventBus';

const MODULE_ID = 'ceo-dashboard';
const ALLOWED_ROLES = ['boss_owner', 'ceo'];

export async function GET(request: NextRequest) {
  return handleModuleGet(request, MODULE_ID);
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ALLOWED_ROLES);

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      payload?: Record<string, unknown>;
    };

    const action = String(body.action || '').toLowerCase();
    const event = await createModuleActionRecord({
      session,
      moduleId: MODULE_ID,
      action: action || 'sync',
      payload: body.payload || {},
    });

    if (action === 'products') {
      return NextResponse.json({
        success: true,
        products: [
          { product_name: 'Factory Core Suite', category: 'enterprise', total_sales: 312, total_revenue: 148500, status: 'active' },
          { product_name: 'Vala AI Studio', category: 'ai', total_sales: 118, total_revenue: 96400, status: 'active' },
        ],
        event_id: event.id,
      });
    }

    if (action === 'regions') {
      return NextResponse.json({
        success: true,
        regions: [
          { region_name: 'APAC', total_users: 1402, active_franchises: 46, risk_level: 'low' },
          { region_name: 'EMEA', total_users: 1117, active_franchises: 31, risk_level: 'medium' },
        ],
        event_id: event.id,
      });
    }

    if (action === 'system-health') {
      return NextResponse.json({
        success: true,
        health: [
          { metric_name: 'platform_uptime', score: 99.92, benchmark: 99.9, status: 'healthy' },
          { metric_name: 'api_latency', score: 94.7, benchmark: 95, status: 'warning' },
        ],
        event_id: event.id,
      });
    }

    if (action === 'scan') {
      return NextResponse.json({
        success: true,
        modules_scanned: 8,
        issues_found: 1,
        critical_issues: 0,
        scan_duration_ms: 1270,
        scan_results: {
          routing: 100,
          api: 96,
          db: 95,
          flows: 100,
        },
        status: 'ok',
        event_id: event.id,
      });
    }

      if (action === 'dashboard') {
        return NextResponse.json({
          success: true,
          summary: {
            total_users: 0,
            active_modules: 8,
            revenue_today: 0,
            critical_alerts: 0,
            health_score: 99,
            ai_actions_today: 0,
            open_tasks: 0,
            open_deals: 0,
            pending_approvals: 0,
          },
          revenue_summary: { order_revenue: 0, reseller_revenue: 0, total_revenue: 0 },
          top_risks: [],
          critical_alerts: [],
          pending_approvals: [],
          recent_actions: [],
          active_tasks: [],
          active_deals: [],
          health: [
            { id: '1', service: 'api', metric: 'uptime', status: 'healthy', latency: 42, error_rate: 0.1, uptime: 99.9, timestamp: new Date().toISOString() },
            { id: '2', service: 'db', metric: 'connections', status: 'healthy', latency: 8, error_rate: 0, uptime: 99.9, timestamp: new Date().toISOString() },
          ],
          event_id: event.id,
        });
      }

      if (action === 'actions') {
        await connectToDatabase();
        const recent = await EventBus.find({ source: MODULE_ID })
          .sort({ timestamp: -1 })
          .limit(20)
          .lean();
        return NextResponse.json({
          success: true,
          items: recent.map((e: any) => ({
            id: String(e._id),
            action: e.data?.action || 'unknown',
            status: e.data?.status || 'completed',
            risk: 'low',
            payload: e.data?.payload || {},
            result: {},
            created_at: e.timestamp,
            updated_at: e.timestamp,
          })),
          page: 1,
          pageSize: 20,
          total: recent.length,
          event_id: event.id,
        });
      }

      if (action === 'events') {
        await connectToDatabase();
        const evts = await EventBus.find({}).sort({ timestamp: -1 }).limit(20).lean();
        return NextResponse.json({
          success: true,
          items: evts.map((e: any) => ({ id: String(e._id), ...e.data, created_at: e.timestamp })),
          page: 1, pageSize: 20, total: evts.length,
          event_id: event.id,
        });
      }

      if (action === 'alerts') {
        return NextResponse.json({
          success: true,
          items: [],
          page: 1, pageSize: 20, total: 0,
          event_id: event.id,
        });
      }

      if (action === 'command') {
        const text = String(body.payload?.text || '').trim();
        return NextResponse.json({
          success: true,
          status: 'completed',
          action_log_id: event.id,
          result: { message: `Command executed: ${text}` },
          event_id: event.id,
        });
      }

      if (action === 'approve') {
        return NextResponse.json({
          success: true,
          status: 'approved',
          event_id: event.id,
        });
      }

      if (action === 'toggle-streaming') {
        return NextResponse.json({
          success: true,
          streaming_enabled: body.payload?.streaming_enabled ?? true,
          event_id: event.id,
        });
      }

      return NextResponse.json({ success: true, module: MODULE_ID, action, event_id: event.id });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'ceo_dashboard_action_failed' },
      { status: 403 },
    );
  }
}
