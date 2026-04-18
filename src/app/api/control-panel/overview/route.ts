import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireRole, requireTenant } from '@/lib/api/sessionAuth';
import connectToDatabase from '@/lib/database';
import User from '@/models/User';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import EventBus from '@/models/EventBus';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin']);

    await connectToDatabase();

    const [usersCount, ordersCount, financeCount, systemCount] = await Promise.all([
      User.countDocuments({}),
      Order.countDocuments({ tenantId: session.tenant_id }),
      Payment.countDocuments({ 'metadata.tenant_id': session.tenant_id }),
      EventBus.countDocuments({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ]);

    return NextResponse.json({
      success: true,
      modules: {
        users: { status: 'ok', total: usersCount },
        orders: { status: 'ok', total: ordersCount },
        finance: { status: 'ok', total: financeCount },
        system: { status: 'ok', events_last_24h: systemCount },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'control_overview_unauthorized' }, { status: 401 });
  }
}
