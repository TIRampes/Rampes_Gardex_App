import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ╔══════════════════════════════════════════════════════╗
// ║         PROXY — SÉCURITÉ ROUTES (NEXT 16)            ║
// ╚══════════════════════════════════════════════════════╝

const PUBLIC_ROUTES = [
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/login'
]

const CRON_ROUTES = [
  '/api/attentes/cron',
  '/api/production/cron'
]

export function proxy(request: NextRequest) {

  const pathname = request.nextUrl.pathname

  // 1️⃣ Routes publiques
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // 2️⃣ Sécurité CRON
  if (CRON_ROUTES.some(route => pathname.startsWith(route))) {

    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Non autorisé — secret CRON invalide' },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // 3️⃣ Routes API
  if (pathname.startsWith('/api/')) {

    const response = NextResponse.next()

    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    return response
  }

  // 4️⃣ Vérification session dashboard (optionnel)
  /*
  const dashboardRoutes = [
    '/attentes',
    '/inventaire',
    '/production',
    '/planification',
    '/commandes',
    '/clients'
  ]

  if (dashboardRoutes.some(route => pathname.startsWith(route))) {

    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  */

  return NextResponse.next()
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
    '/'
  ]
}