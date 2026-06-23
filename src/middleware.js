import { NextResponse } from 'next/server';

const COOKIE_NAME = 'meeting_app_token';

export function middleware(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Define public paths that shouldn't be protected
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isLandingPath = pathname === '/';
  
  // Protected paths
  const isProtectedPath = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/history') || 
    pathname.startsWith('/settings');

  // If user has token and is trying to access auth/landing pages, redirect to dashboard
  if (token && (isAuthPath || isLandingPath)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user does not have token and is trying to access protected pages, redirect to login
  if (!token && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    // Optionally preserve the destination URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Specify matcher to avoid running middleware on static resources or API paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
