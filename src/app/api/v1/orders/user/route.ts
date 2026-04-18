import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';
import connectToDatabase from '@/lib/database';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    await connectToDatabase();
    const orders = await Order.find({ userId: session.user_id, tenantId: session.tenant_id })
      .sort({ createdAt: -1 })
      .limit(200);
    return NextResponse.json({ success: true, user_id: session.user_id, orders });
  } catch {
    return NextResponse.json({ success: false, error: 'orders_user_unauthorized' }, { status: 401 });
  }
}
