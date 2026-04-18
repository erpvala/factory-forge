import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireTenant } from '@/lib/api/sessionAuth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    return NextResponse.json({ success: true, ...session });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'session_unauthorized' }, { status: 401 });
  }
}
