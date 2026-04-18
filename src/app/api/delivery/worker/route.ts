import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import connectToDatabase from '@/lib/database';
import { getSessionFromRequest, requireRole, requireTenant } from '@/lib/api/sessionAuth';
import { claimNextDeliveryJob, completeDeliveryJob } from '@/lib/queue/deliveryQueue';
import License from '@/models/License';
import ApiKey from '@/models/ApiKey';
import Order from '@/models/Order';
import { triggerGlobalHooksAsync } from '@/lib/hooks/globalHookSystem';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin', 'support']);
    const job = claimNextDeliveryJob();
    if (!job) {
      return NextResponse.json({ success: true, job: null });
    }
    return NextResponse.json({ success: true, job });
  } catch {
    return NextResponse.json({ success: false, error: 'delivery_worker_unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin', 'support']);

    const body = await request.json();
    const jobId = String(body.job_id || '');
    const orderId = String(body.order_id || '');
    const userId = String(body.user_id || '');
    const productId = String(body.product_id || '');

    await connectToDatabase();

    const license = await License.create({
      userId,
      productId: productId || 'product_unknown',
      licenseKey: `lic_${randomUUID().replace(/-/g, '')}`,
      type: 'STANDARD',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      features: [],
      metadata: { order_id: orderId, source: 'delivery_worker' },
    });

    const apiKey = await ApiKey.create({
      userId,
      orderId,
      key: `api_${randomUUID().replace(/-/g, '')}`,
      status: 'active',
    });

    await Order.findByIdAndUpdate(orderId, { status: 'DELIVERED' });

    completeDeliveryJob(jobId, false);

    triggerGlobalHooksAsync({
      event: 'delivery_done',
      module: 'orders',
      payload: {
        order_id: orderId,
        user_id: userId,
        product_id: productId,
        license_id: String(license._id),
        api_key_id: String(apiKey._id),
      },
      hookType: 'post_action_hook',
    });

    return NextResponse.json({
      success: true,
      delivered: true,
      license_id: license._id,
      api_key_id: apiKey._id,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'delivery_worker_process_failed' }, { status: 400 });
  }
}
