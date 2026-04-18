import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireRole, requireTenant } from '@/lib/api/sessionAuth';
import { createModuleActionRecord } from '@/lib/api/controlPanelModuleApi';
import connectToDatabase from '@/lib/database';
import EventBus from '@/models/EventBus';

const MODULE_ID = 'server-manager';
const ALLOWED_ROLES = ['boss_owner', 'server_manager'];

type IncidentRow = {
  _id: unknown;
  data?: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    escalated_to?: string | null;
    server_id?: string;
    server_name?: string;
    action_type?: string;
  };
  timestamp?: Date;
};

const SERVERS = [
  { id: 'srv_1', server_name: 'prod-core-01' },
  { id: 'srv_2', server_name: 'staging-core-01' },
  { id: 'srv_3', server_name: 'edge-asia-01' },
];

function getPathParts(request: NextRequest): string[] {
  return request.nextUrl.pathname
    .replace('/api/v1/server-manager/', '')
    .split('/')
    .filter(Boolean);
}

function getServerName(serverId?: string) {
  return SERVERS.find((item) => item.id === serverId)?.server_name || 'prod-core-01';
}

async function readIncidents(tenantId: string) {
  const rows = (await EventBus.find({
    source: MODULE_ID,
    eventType: 'server_incident',
    'data.tenant_id': tenantId,
  })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean()) as IncidentRow[];

  return rows.map((row) => ({
    id: String(row._id),
    title: row.data?.title || 'Untitled incident',
    description: row.data?.description || null,
    priority: row.data?.priority || 'medium',
    status: row.data?.status || 'open',
    created_at: row.timestamp?.toISOString() || new Date().toISOString(),
    updated_at: row.timestamp?.toISOString() || new Date().toISOString(),
    escalated_to: row.data?.escalated_to || null,
    server_instances: {
      server_name: row.data?.server_name || getServerName(row.data?.server_id),
    },
  }));
}

async function writeAction(
  session: { user_id: string; tenant_id: string; role: string; permissions: string[] },
  action: string,
  payload?: Record<string, unknown>,
) {
  await createModuleActionRecord({
    session,
    moduleId: MODULE_ID,
    action,
    payload: payload || {},
    eventType: 'server_operation',
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ALLOWED_ROLES);
    await connectToDatabase();

    const parts = getPathParts(request);
    const route = parts.join('/').toLowerCase();

    if (route === 'dashboard/health') {
      return NextResponse.json({
        nodes: [
          {
            id: 'node_1',
            name: 'Prod Node A',
            region: 'us-east',
            status: 'online',
            cpu: { name: 'CPU', value: 51, max: 100, unit: '%', status: 'healthy', trend: 'stable' },
            ram: { name: 'RAM', value: 64, max: 100, unit: '%', status: 'warning', trend: 'up' },
            disk: { name: 'Disk', value: 38, max: 100, unit: '%', status: 'healthy', trend: 'stable' },
            network: { name: 'Network', value: 22, max: 1000, unit: 'Mbps', status: 'healthy', trend: 'stable' },
            uptime: '19d 04h',
            lastCheck: new Date().toISOString(),
          },
        ],
      });
    }

    if (route === 'services/status') {
      return NextResponse.json({
        services: [
          {
            id: 'svc_api',
            name: 'Gateway API',
            type: 'api',
            status: 'running',
            version: 'v3.2.0',
            uptime: '12d 06h',
            latency: 38,
            lastRestart: new Date(Date.now() - 86400000).toISOString(),
            connections: 143,
            errors24h: 2,
          },
          {
            id: 'svc_queue',
            name: 'Event Queue',
            type: 'queue',
            status: 'degraded',
            version: 'v1.9.1',
            uptime: '7d 02h',
            latency: 86,
            lastRestart: new Date(Date.now() - 2 * 86400000).toISOString(),
            connections: 57,
            errors24h: 14,
          },
        ],
      });
    }

    if (route === 'security/secrets') {
      return NextResponse.json({
        secrets: [
          {
            id: 'sec_api_main',
            name: 'API_GATEWAY_TOKEN',
            type: 'api_key',
            environment: 'production',
            maskedValue: '************R8K1',
            lastRotated: new Date(Date.now() - 6 * 86400000).toISOString(),
            expiresAt: new Date(Date.now() + 24 * 86400000).toISOString(),
            rotationPolicy: '30d',
            status: 'expiring_soon',
          },
          {
            id: 'sec_db',
            name: 'POSTGRES_RW_SECRET',
            type: 'database',
            environment: 'production',
            maskedValue: '************9J2A',
            lastRotated: new Date(Date.now() - 3 * 86400000).toISOString(),
            expiresAt: null,
            rotationPolicy: 'manual',
            status: 'active',
          },
        ],
      });
    }

    if (route === 'incidents') {
      const incidents = await readIncidents(session.tenant_id);
      return NextResponse.json({ incidents });
    }

    if (route === 'servers') {
      return NextResponse.json({ servers: SERVERS });
    }

    if (route === 'database/health') {
      return NextResponse.json({
        databases: [
          {
            name: 'factory_forge_main',
            status: 'healthy',
            connections: { active: 42, idle: 18, max: 200 },
            replication: { lag: 0.4, status: 'synced' },
            storage: { used: 182, total: 512 },
            uptime: '31d 02h',
            version: 'Postgres 16',
          },
        ],
        slow_queries: [
          {
            id: 'sq_1',
            duration: 124,
            calls: 63,
            avgTime: 41,
            queryPattern: 'SELECT ... FROM event_bus WHERE source = ?',
            lastSeen: new Date().toISOString(),
          },
        ],
      });
    }

    if (route === 'backups/overview') {
      return NextResponse.json({
        schedules: [
          {
            id: 'sch_daily',
            name: 'Daily Full Backup',
            frequency: 'daily',
            nextRun: new Date(Date.now() + 6 * 3600000).toISOString(),
            lastRun: new Date(Date.now() - 18 * 3600000).toISOString(),
            isActive: true,
          },
        ],
        backups: [
          {
            id: 'bkp_1',
            name: 'prod-full-2026-04-07',
            type: 'full',
            environment: 'production',
            status: 'completed',
            size: '48 GB',
            createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
            expiresAt: null,
            integrityStatus: 'verified',
            encryptionStatus: 'encrypted',
          },
          {
            id: 'bkp_2',
            name: 'staging-snapshot-2026-04-07',
            type: 'snapshot',
            environment: 'staging',
            status: 'completed',
            size: '10 GB',
            createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
            expiresAt: null,
            integrityStatus: 'pending',
            encryptionStatus: 'encrypted',
          },
        ],
      });
    }

    if (route === 'system/audit') {
      const logs = await EventBus.find({
        source: MODULE_ID,
        'data.tenant_id': session.tenant_id,
      })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();

      return NextResponse.json({
        audit: logs.map((log) => ({
          id: String(log._id),
          action: String(log.data?.action || log.eventType || 'event'),
          action_type: String(log.eventType || 'server_operation'),
          created_at: log.timestamp,
          performed_by_role: session.role,
          server_instances: {
            server_name: String(log.data?.server_name || 'prod-core-01'),
          },
          approval_status: log.processed ? 'approved' : 'pending',
        })),
      });
    }

    return NextResponse.json({ success: true, route, status: 'ok' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'server_manager_read_failed' },
      { status: 403 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ALLOWED_ROLES);
    await connectToDatabase();

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const parts = getPathParts(request);
    const route = parts.join('/').toLowerCase();

    if (route === 'incidents') {
      const created = await EventBus.create({
        eventType: 'server_incident',
        source: MODULE_ID,
        data: {
          title: String(body.title || 'Untitled incident'),
          description: String(body.description || ''),
          priority: String(body.priority || 'medium'),
          status: 'open',
          server_id: String(body.server_id || SERVERS[0].id),
          server_name: getServerName(String(body.server_id || SERVERS[0].id)),
          tenant_id: session.tenant_id,
          user_id: session.user_id,
        },
        userId: session.user_id,
        processed: false,
        timestamp: new Date(),
      });

      await writeAction(session, 'incident_create', {
        incident_id: String(created._id),
        title: String(body.title || 'Untitled incident'),
      });

      return NextResponse.json({ success: true, incident_id: String(created._id) });
    }

    if (route.startsWith('incidents/') && route.endsWith('/escalate')) {
      const incidentId = parts[1] || '';
      const target = body.target ? String(body.target) : '';
      await EventBus.updateOne(
        { _id: incidentId, eventType: 'server_incident', source: MODULE_ID, 'data.tenant_id': session.tenant_id },
        {
          $set: {
            'data.escalated_to': target,
            timestamp: new Date(),
          },
        },
      );

      await writeAction(session, 'incident_escalate', {
        incident_id: incidentId,
        target,
      });

      return NextResponse.json({ success: true });
    }

    if (route.startsWith('incidents/') && route.endsWith('/status')) {
      const incidentId = parts[1] || '';
      await EventBus.updateOne(
        { _id: incidentId, eventType: 'server_incident', source: MODULE_ID, 'data.tenant_id': session.tenant_id },
        {
          $set: {
            'data.status': String(body.status || 'open'),
            timestamp: new Date(),
          },
        },
      );

      await writeAction(session, 'incident_status', {
        incident_id: incidentId,
        status: String(body.status || 'open'),
      });

      return NextResponse.json({ success: true });
    }

    if (route.startsWith('services/') && route.endsWith('/restart')) {
      const serviceId = parts[1] || 'unknown-service';
      await writeAction(session, 'service_restart', { service_id: serviceId });
      return NextResponse.json({ success: true, message: 'Service restart queued' });
    }

    if (route.startsWith('security/secrets/') && route.endsWith('/rotate')) {
      const secretId = parts[2] || 'unknown-secret';
      await writeAction(session, 'secret_rotate', { secret_id: secretId });
      return NextResponse.json({ success: true, message: 'Secret rotation queued' });
    }

    if (route.startsWith('backups/') && route.endsWith('/restore')) {
      const backupId = parts[1] || 'unknown-backup';
      await writeAction(session, 'backup_restore', { backup_id: backupId });
      return NextResponse.json({ success: true, message: 'Restore request submitted' });
    }

    if (route.startsWith('backups/') && route.endsWith('/verify')) {
      const backupId = parts[1] || 'unknown-backup';
      await writeAction(session, 'backup_verify', { backup_id: backupId });
      return NextResponse.json({ success: true });
    }

    const action = String(body.action || 'sync').toLowerCase();
    await writeAction(session, action, {
      route,
      payload: body,
    });

    return NextResponse.json({ success: true, route, action });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'server_manager_action_failed' },
      { status: 403 },
    );
  }
}
