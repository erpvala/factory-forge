import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';
import connectToDatabase from '@/lib/database';
import License from '@/models/License';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    await connectToDatabase();
    const licenses = await License.find({ userId: session.user_id })
      .sort({ createdAt: -1 })
      .limit(200);
    return NextResponse.json({ success: true, user_id: session.user_id, licenses });
  } catch {
    return NextResponse.json({ success: false, error: 'licenses_unauthorized' }, { status: 401 });
  }
}
