// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: proxy.ts (ou middleware.ts selon ton setup)      ║
// ║  REMPLACE ton proxy.ts existant                           ║
// ╚══════════════════════════════════════════════════════════╝

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { routeAutorisee } from '@/lib/auth-config';

const PUBLIC_ROUTES = ['/api/auth', '/_next', '/favicon.ico', '/login'];
const CRON_ROUTES = ['/api/attentes/cron', '/api/production/cron'];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // 1️⃣ Routes publiques
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // 2️⃣ Sécurité CRON
  if (CRON_ROUTES.some((r) => pathname.startsWith(r))) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé — secret CRON invalide' }, { status: 401 });
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
    // Pas connecté → login
    if (pathname !== '/login' && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // 5️⃣ NOUVEAU: Vérification rôle pour les routes dashboard
  if (pathname.startsWith('/dashboard/')) {
    const role = (user as any).role || 'EMPLOYE';

    if (!routeAutorisee(role, pathname)) {
      // Pas le droit → retour au dashboard avec message
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
    '/',
  ],
};