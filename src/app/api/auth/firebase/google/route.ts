// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { loginWithGoogle } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const result = await loginWithGoogle();

    if (result.success) {
      const response = NextResponse.json({
        success: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          emailVerified: result.user.emailVerified
        }
      });

      // Set session cookie
      response.cookies.set('firebase-session-token', 'demo-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return response;
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Firebase Google login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
