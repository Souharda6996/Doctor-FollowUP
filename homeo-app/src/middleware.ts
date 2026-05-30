import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Exclude auth routes, static files, api routes from strict redirection
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/login' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Get the role from the cookie we set in AuthContext
  const roleCookie = req.cookies.get('medifollowup_role');
  
  if (!roleCookie) {
    // If trying to access protected route without a role/session
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const role = roleCookie.value;

  // Simple Role-Based Access Control
  if (pathname.startsWith('/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }
  if (pathname.startsWith('/patient') && role !== 'patient') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }
  if (pathname.startsWith('/caregiver') && role !== 'caregiver') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
