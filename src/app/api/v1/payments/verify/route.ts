import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';
import { triggerGlobalHooksAsync } from '@/lib/hooks/globalHookSystem';
import connectToDatabase from '@/lib/database';
import Payment from '@/models/Payment';
import Order from '@/models/Order';
import LedgerEntry from '@/models/LedgerEntry';
import Commission from '@/models/Commission';
import Wallet from '@/models/Wallet';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    const body = await request.json();
    const orderId = String(body.order_id || `ord_${Date.now()}`);
    const paymentId = String(body.payment_id || `pay_${Date.now()}`);

    await connectToDatabase();

    const order = await Order.findOne({ _id: orderId, tenantId: session.tenant_id });
    if (!order) {
      return NextResponse.json({ success: false, error: 'payment_verify_order_not_found' }, { status: 404 });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'COMPLETED',
        metadata: {
          ...(body.metadata || {}),
          order_id: orderId,
          verified_at: new Date().toISOString(),
          tenant_id: session.tenant_id,
        },
      },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json({ success: false, error: 'payment_verify_payment_not_found' }, { status: 404 });
    }

    await Order.findByIdAndUpdate(orderId, { status: 'PAID', paymentId: String(payment._id) });

    await LedgerEntry.insertMany([
      {
        tenantId: session.tenant_id,
        orderId,
        paymentId: String(payment._id),
        entryType: 'DEBIT_USER',
        amount: Number(payment.amount || order.amount || 0),
        currency: String(payment.currency || order.currency || 'USD'),
      },
      {
        tenantId: session.tenant_id,
        orderId,
        paymentId: String(payment._id),
        entryType: 'CREDIT_SYSTEM',
        amount: Number(payment.amount || order.amount || 0),
        currency: String(payment.currency || order.currency || 'USD'),
      },
    ]);

    const total = Number(payment.amount || order.amount || 0);
    const systemShare = Math.round(total * 0.7 * 100) / 100;
    const resellerShare = Math.round(total * 0.3 * 100) / 100;
    await Commission.insertMany([
      {
        tenantId: session.tenant_id,
        orderId,
        paymentId: String(payment._id),
        recipientType: 'SYSTEM',
        amount: systemShare,
        currency: String(payment.currency || order.currency || 'USD'),
      },
      {
        tenantId: session.tenant_id,
        orderId,
        paymentId: String(payment._id),
        recipientType: 'RESELLER',
        amount: resellerShare,
        currency: String(payment.currency || order.currency || 'USD'),
      },
    ]);

    await Wallet.findOneAndUpdate(
      { userId: session.user_id },
      {
        userId: session.user_id,
        tenantId: session.tenant_id,
        $inc: { balance: resellerShare },
        currency: String(payment.currency || order.currency || 'USD'),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    triggerGlobalHooksAsync({
      event: 'payment_success',
      module: 'payments',
      payload: {
        order_id: orderId,
        payment_id: String(payment._id),
        status: 'success',
        tenant_id: session.tenant_id,
      },
      hookType: 'post_action_hook',
    });

    return NextResponse.json({ success: true, payment_id: String(payment._id), status: 'success' });
  } catch {
    return NextResponse.json({ success: false, error: 'payment_verify_failed' }, { status: 401 });
  }
}
