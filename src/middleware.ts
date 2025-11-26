import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const pathname = req.nextUrl.pathname;

  // Protected routes that have their own auth checks
  const isDashboardRoute = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/companies') ||
                          pathname.startsWith('/support') ||
                          pathname.startsWith('/settings');

  const isClientRoute = pathname.startsWith('/client');
  const isClientLoginPage = pathname === '/client/login';
  const isStaffLoginPage = pathname === '/login';

  // Protected client portal routes that have their own auth checks
  const isClientPortalRoute = isClientRoute && !isClientLoginPage;

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    // If there's an error, don't redirect - let the layout handle it
    if (error) {
      console.error('Middleware auth error:', error);
      return res;
    }

    // Handle client portal
    if (isClientRoute) {
      // If logged in and on client login page, redirect to client dashboard
      if (session && isClientLoginPage) {
        return NextResponse.redirect(new URL('/client/dashboard', req.url));
      }
      // If accessing client portal routes, let the layout handle auth (don't redirect here)
      if (isClientPortalRoute) {
        return res;
      }
      // Allow access to login page
      return res;
    }

    // Handle staff routes
    // If user is logged in and tries to access staff login page, redirect to dashboard
    if (session && isStaffLoginPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If accessing dashboard routes, let the layout handle auth (don't redirect here)
    if (isDashboardRoute) {
      return res;
    }

    // For other staff routes, only redirect if truly no session
    if (!session && !isStaffLoginPage) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return res;
  } catch (error) {
    // On any error, don't redirect - let the app handle it
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|hero.png|hero.jpg|hero-video.mp4|globe-video.mp4|fonts/).*)'],
};