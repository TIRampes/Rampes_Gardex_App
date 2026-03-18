// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: proxy.ts                                        ║
// ║  REMPLACE ton proxy.ts existant                           ║
// ║  Ajout: vérification MFA après login Microsoft            ║
// ╚══════════════════════════════════════════════════════════╝

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { routeAutorisee } from '@/lib/auth-config';

const PUBLIC_ROUTES = ['/api/auth', '/_next', '/favicon.ico', '/login', '/mfa'];
const CRON_ROUTES = ['/api/attentes/cron', '/api/production/cron'];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // 1️⃣ Routes publiques + MFA page
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // 2️⃣ Sécurité CRON
  if (CRON_ROUTES.some((r) => pathname.startsWith(r))) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 3️⃣ Headers sécurité API
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // 4️⃣ Vérification session
  const user = (req as any).auth?.user;

  if (!user) {
    if (pathname !== '/login' && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // 5️⃣ Vérification MFA
  const mfaRequired = (user as any).mfaRequired === true;       // a un secret → code requis
  const mfaSetupNeeded = (user as any).mfaSetupNeeded === true; // pas de secret → scanner QR
  const mfaVerified = req.cookies.get('mfa-verified')?.value === 'true';

  if (pathname.startsWith('/dashboard')) {
    // Doit scanner le QR d'abord
    if (mfaSetupNeeded && !mfaVerified) {
      return NextResponse.redirect(new URL('/mfa/setup', req.url));
    }
    // A un secret mais pas encore vérifié → page code
    if (mfaRequired && !mfaVerified) {
      return NextResponse.redirect(new URL('/mfa', req.url));
    }
  }

  // 6️⃣ Vérification rôle pour les routes dashboard
  if (pathname.startsWith('/dashboard/')) {
    const role = (user as any).role || 'EMPLOYE';
    if (!routeAutorisee(role, pathname)) {
      const url = new URL('/dashboard/dashboard', req.url);
      url.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/login',
    '/mfa',
    '/',
  ],
};