// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser();

    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        }
      });
    } else {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Firebase auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
