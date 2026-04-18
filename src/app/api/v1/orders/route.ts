import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';
import { triggerGlobalHooksAsync } from '@/lib/hooks/globalHookSystem';
import connectToDatabase from '@/lib/database';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    const body = await request.json();
    await connectToDatabase();

    const order = await Order.create({
      userId: session.user_id,
      tenantId: session.tenant_id,
      productId: String(body.product_id || ''),
      amount: Number(body.amount || 0),
      currency: String(body.currency || 'USD'),
      status: 'CREATED',
    });

    triggerGlobalHooksAsync({
      event: 'order_paid',
      module: 'orders',
      payload: { order_id: String(order._id), phase: 'order_created' },
      hookType: 'pre_action_hook',
    });

    return NextResponse.json({ success: true, order });
  } catch {
    return NextResponse.json({ success: false, error: 'order_create_failed' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    await connectToDatabase();
    const userOrders = await Order.find({ userId: session.user_id, tenantId: session.tenant_id })
      .sort({ createdAt: -1 })
      .limit(200);
    return NextResponse.json({ success: true, orders: userOrders });
  } catch {
    return NextResponse.json({ success: false, error: 'orders_fetch_failed' }, { status: 401 });
  }
}
