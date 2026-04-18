// @ts-nocheck
import { NextResponse } from 'next/server';
import { logout } from '@/lib/firebase';

export async function POST() {
  try {
    const result = await logout();

    if (result.success) {
      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      });

      // Clear session cookie
      response.cookies.set('firebase-session-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0) // Immediately expire
      });

      return response;
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Firebase logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
