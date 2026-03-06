import { NextRequest, NextResponse } from 'next/server';
import { envoyerConseilsPrevention } from '@/app/services/reprises-email.service';

// POST /api/reprises/cron-conseils
// Appelé par un cron job toutes les 72h (ou tous les 3 jours)
// Vercel: cron: "0 8 */3 * *" (tous les 3 jours à 8h)
// Sécurisé par CRON_SECRET
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const result = await envoyerConseilsPrevention();

    return NextResponse.json({
      success: result.envoyes > 0,
      message: `Conseils & Prévention: ${result.envoyes} email(s) envoyé(s) via Microsoft 365`,
      ...result,
    });
  } catch (error) {
    console.error('CRON /api/reprises/cron-conseils erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}