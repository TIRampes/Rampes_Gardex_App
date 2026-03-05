import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import path from 'path/win32';

// ╔══════════════════════════════════════════════════════╗
// ║     MIDDLEWARE — SÉCURITÉ ROUTES (PROJET ENTIER)     ║
// ╚══════════════════════════════════════════════════════╝

const PUBLIC_ROUTES = ['/api/auth', '/_next', '/favicon.ico', '/login'];

const CRON_ROUTES = ['/api/attentes/cron', '/api/production/cron'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Routes publiques → passer
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // 2. Routes CRON → vérifier le secret
  if (CRON_ROUTES.some((r) => pathname.startsWith(r))) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé — secret CRON invalide' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 3. Routes API → sécurité headers + vérification session
  if (pathname.startsWith('/api/')) {
    // Vérifier session (décommenter pour activer)
    // const sessionToken =
    //   request.cookies.get('next-auth.session-token')?.value ||
    //   request.cookies.get('__Secure-next-auth.session-token')?.value;
    // const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    // if (!sessionToken && !bearerToken) {
    //   return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    // }

    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return response;
  }

  // 4. Pages dashboard → vérifier session (décommenter pour activer)
  // const dashboardRoutes = ['/attentes', '/inventaire', '/production', '/planification', '/commandes', '/clients'];
  // if (dashboardRoutes.some((r) => pathname.startsWith(r))) {
  //   const sessionToken =
  //     request.cookies.get('next-auth.session-token')?.value ||
  //     request.cookies.get('__Secure-next-auth.session-token')?.value;
  //   if (!sessionToken) {
  //     return NextResponse.redirect(new URL('/login', request.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/attentes/:path*',
    '/inventaire/:path*',
    '/production/:path*',
    '/planification/:path*',
    '/commandes/:path*',
    '/clients/:path*',
    '/achats/:path*',
    '/reprises/:path*',
    '/login/:path*',
    '/',
  ],
};