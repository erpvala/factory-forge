// @ts-nocheck
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Firebase Auth middleware (alternative to JWT)
export function firebaseMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookie
  const sessionToken = request.cookies.get('firebase-session-token')?.value;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/apply/developer', '/apply/reseller', '/apply/franchise', '/apply/influencer', '/apply/job', '/404'];
  
  // If accessing public route, allow
  if (publicRoutes.includes(pathname) || pathname.startsWith('/apply/')) {
    return NextResponse.next();
  }

  // If not logged in and trying to access protected route, redirect to login
  if (!sessionToken && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // TODO: Verify Firebase session token here
  // You would need to decode the Firebase session token
  // For now, we'll just check if it exists

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
