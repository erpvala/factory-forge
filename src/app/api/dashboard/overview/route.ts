import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { getSessionFromRequest, requireRole, requireTenant } from '@/lib/api/sessionAuth';
import Application from '@/models/Application';
import EventBus from '@/models/EventBus';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { CONTROL_PANEL_MODULES } from '@/config/controlPanelModules';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin']);

    await connectToDatabase();

    const [
      totalUsers,
      totalOrders,
      pendingApplications,
      recentEvents,
      totalRevenueResult,
      unreadNotifications,
      activeSources,
      paymentFailures,
    ] = await Promise.all([
      User.countDocuments({}),
      Order.countDocuments({ tenantId: session.tenant_id }),
      Application.countDocuments({ status: 'PENDING' }),
      EventBus.find({ 'data.tenant_id': session.tenant_id }).sort({ timestamp: -1 }).limit(8).lean(),
      Payment.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      EventBus.countDocuments({ eventType: 'notification_event', 'data.target_user_id': session.user_id }),
      EventBus.distinct('source', {
        'data.tenant_id': session.tenant_id,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      Payment.countDocuments({ status: 'FAILED' }),
    ]);

    const totalRevenue = Number(totalRevenueResult?.[0]?.totalRevenue || 0);
    const recentErrors = recentEvents.filter((event) => String(event.error || '').trim()).length;
    const systemHealth = Math.max(0, Math.min(100, 100 - paymentFailures * 4 - recentErrors * 8));

    return NextResponse.json({
      success: true,
      overview: {
        totalUsers,
        totalOrders,
        totalRevenue,
        systemHealth,
        activeModules: activeSources.length || CONTROL_PANEL_MODULES.length,
        pendingApplications,
        unreadNotifications,
        moduleStatuses: activeSources.slice(0, 8).map((source) => ({
          moduleId: String(source || 'control-panel'),
          actions: recentEvents.filter((event) => event.source === source).length,
        })),
        recentEvents: recentEvents.map((event) => ({
          id: String(event._id),
          title: String(event.eventType || 'System Event').replace(/_/g, ' '),
          message: String(event.data?.action || event.data?.message || event.source || 'Event received'),
          status: String(event.error || '').trim() ? 'pending' : event.processed ? 'success' : 'info',
          createdAt: event.timestamp instanceof Date ? event.timestamp.toISOString() : new Date(event.timestamp || Date.now()).toISOString(),
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'dashboard_overview_failed' },
      { status: 403 },
    );
  }
}
