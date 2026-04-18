import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';
import connectToDatabase from '@/lib/database';
import Payment from '@/models/Payment';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    const body = await request.json();
    const orderId = String(body.order_id || '');
    await connectToDatabase();

    const order = await Order.findOne({ _id: orderId, tenantId: session.tenant_id });
    if (!order) {
      return NextResponse.json({ success: false, error: 'payment_order_not_found' }, { status: 404 });
    }

    const payment = await Payment.create({
      userId: session.user_id,
      amount: Number(body.amount || order.amount || 0),
      currency: String(body.currency || order.currency || 'USD'),
      status: 'PENDING',
      paymentMethod: String(body.payment_method || 'mock_gateway'),
      transactionId: `txn_${Date.now()}`,
      description: `Payment for order ${orderId}`,
      metadata: {
        order_id: orderId,
        tenant_id: session.tenant_id,
      },
    });

    return NextResponse.json({
      success: true,
      payment_id: payment._id,
      payment_url: `/mock-gateway/pay/${orderId || Date.now()}`,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'payment_init_failed' }, { status: 401 });
  }
}
