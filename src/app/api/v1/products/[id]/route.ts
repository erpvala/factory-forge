import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/api/sessionAuth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    getSessionFromRequest(request);
    const id = String(params.id || '');
    return NextResponse.json({ success: true, product: { id, name: `Product ${id}`, price: 0 } });
  } catch {
    return NextResponse.json({ success: false, error: 'product_detail_unauthorized' }, { status: 401 });
  }
}
