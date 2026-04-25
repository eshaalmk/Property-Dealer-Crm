import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin-only routes
    const adminRoutes = ['/dashboard', '/agents', '/analytics'];
    const isAdminRoute = adminRoutes.some(r => pathname.startsWith(r));

    if (isAdminRoute && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/leads', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/agents/:path*',
    '/analytics/:path*',
    '/reminders/:path*',
    '/api/leads/:path*',
    '/api/agents/:path*',
    '/api/analytics/:path*',
    '/api/reminders/:path*',
    '/api/export/:path*',
  ],
};
