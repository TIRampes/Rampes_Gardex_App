import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'; 
import { envoyerConseilsPrevention } from '@/app/services/reprises-email.service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const cookieStore = await cookies();

    // --- DEBUG : Supprime ces logs après tes tests ---
    const allCookies = cookieStore.getAll().map(c => c.name);
    console.log("🍪 Cookies détectés par l'API :", allCookies);
    // ------------------------------------------------

    // 1. Vérification du Secret (CRON)
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    // 2. Vérification de la session (Bouton Manuel)
    // On vérifie tous les noms de cookies possibles pour NextAuth
    const hasSession = 
      cookieStore.has('next-auth.session-token') || 
      cookieStore.has('__Secure-next-auth.session-token') ||
      cookieStore.has('next-auth.callback-url'); // Un indicateur de secours

    // 3. Sécurité permissive pour le développement local
    const isLocal = process.env.NODE_ENV === 'development';

    if (!isCron && !hasSession && !isLocal) {
      return NextResponse.json({ 
        error: 'Non autorisé', 
        debug_cookies: allCookies 
      }, { status: 401 });
    }

    console.log("🔓 Accès autorisé (via " + (isCron ? "CRON" : (isLocal ? "Local/Dev" : "Session")) + ")");

    const result = await envoyerConseilsPrevention();

    return NextResponse.json({
      success: true,
      message: `Envoi réussi`,
      ...result,
    });

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}