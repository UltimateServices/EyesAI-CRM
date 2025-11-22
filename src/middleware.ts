import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const pathname = req.nextUrl.pathname;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Client portal routes
  const isClientRoute = pathname.startsWith('/client');
  const isClientLoginPage = pathname === '/client/login';

  // Staff routes
  const isStaffLoginPage = pathname === '/login';

  // Handle client portal
  if (isClientRoute) {
    // If logged in and on client login page, redirect to client dashboard
    if (session && isClientLoginPage) {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
    // If not logged in and trying to access protected client routes
    if (!session && !isClientLoginPage) {
      return NextResponse.redirect(new URL('/client/login', req.url));
    }
    return res;
  }

  // Handle staff routes
  // If user is logged in and tries to access staff login page, redirect to dashboard
  if (session && isStaffLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and tries to access protected staff routes, redirect to login
  if (!session && !isStaffLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|hero.png|hero.jpg|hero-video.mp4|globe-video.mp4|fonts/).*)'],
};