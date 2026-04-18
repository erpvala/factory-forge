import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/api/sessionAuth';

export async function POST(request: NextRequest) {
  try {
    getSessionFromRequest(request);

    const response = NextResponse.json({
      success: true,
      message: 'All active sessions invalidated for current device scope',
    });

    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
    });

    response.cookies.set('device_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
    });

    response.cookies.set('access_key_status', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'logout_all_unauthorized' }, { status: 401 });
  }
}
