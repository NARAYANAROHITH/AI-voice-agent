/**
 * Middleware: protect /dashboard routes.
 * Any request to /dashboard/* (except /dashboard/login) requires a valid NextAuth session.
 * Unauthenticated requests are redirected to /dashboard/login.
 */
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  // Let the login page through
  if (pathname === '/dashboard/login') return NextResponse.next();

  // Protect all other /dashboard/* routes
  if (pathname.startsWith('/dashboard')) {
    if (!req.auth) {
      const loginUrl = new URL('/dashboard/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
