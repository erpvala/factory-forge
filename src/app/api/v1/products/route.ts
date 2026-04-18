import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/api/sessionAuth';

const productStore: Array<{ id: string; name: string; price: number }> = [];

export async function GET(request: NextRequest) {
  try {
    getSessionFromRequest(request);
    return NextResponse.json({ success: true, products: productStore });
  } catch {
    return NextResponse.json({ success: false, error: 'products_unauthorized' }, { status: 401 });
  }
}
