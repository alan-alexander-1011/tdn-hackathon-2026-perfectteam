import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export async function middleware(req: NextRequest) {
  const isAdmin = await verifySessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);

  if (isAdmin) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', req.url);
  return NextResponse.redirect(loginUrl);
}

// Only guard the admin dashboard page itself (not /admin/login) and the
// proposals API, which is only ever used by that dashboard.
export const config = {
  matcher: ['/admin', '/api/proposals'],
};
