import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import Application from '@/models/Application';
import { getSessionFromRequest, requireRole, requireTenant } from '@/lib/api/sessionAuth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin', 'support']);
    await connectToDatabase();
    const status = new URL(request.url).searchParams.get('status');
    const limit = Math.max(1, Math.min(50, Number(new URL(request.url).searchParams.get('limit') || '25')));
    const query = status ? { status } : {};
    const applications = await Application.find(query).sort({ createdAt: -1 }).limit(limit);

    return NextResponse.json({
      success: true,
      applications: applications.map((app: any) => ({
        id: app._id,
        userId: app.userId,
        role: app.roleType,
        status: app.status,
        createdAt: app.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'applications_fetch_failed' }, { status: 500 });
  }
}
