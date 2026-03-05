import { NextResponse } from 'next/server';
import { getCommandesEnAttente, getRepresentantsActifs } from '@/app/services/attentes.service';
import { envoyerAttentesGroupees } from '@/app/services/email.service';

// POST /api/attentes/cron
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const aujourdhui = new Date();

    // Exécuter seulement le lundi
    if (aujourdhui.getDay() !== 1) {
      return NextResponse.json({
        message: "Ce n'est pas lundi, envoi ignoré",
        skipped: true,
      });
    }

    const [commandes, representants] = await Promise.all([
      getCommandesEnAttente(),
      getRepresentantsActifs(),
    ]);

    if (!commandes?.length) {
      return NextResponse.json({
        message: 'Aucune commande en attente',
        skipped: true,
      });
    }

    // IDs des représentants présents dans les commandes
    const repIds = [
      ...new Set(
        commandes
          .map((c) => c.representantId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const repsAvecEmail = representants.filter(
      (r) => repIds.includes(r.id) && Boolean(r.email)
    );

    if (repsAvecEmail.length === 0) {
      return NextResponse.json({
        message: 'Aucun représentant avec email',
        skipped: true,
      });
    }

    const result = await envoyerAttentesGroupees(
      repsAvecEmail.map((r) => r.id),
      commandes,
      repsAvecEmail,
      'Envoi automatique du lundi — Rappel hebdomadaire des commandes en attente.'
    );

    return NextResponse.json({
      success: true,
      message: `Envoi auto lundi via Graph: ${result.envoyes}/${result.total} emails envoyés`,
      ...result,
    });

  } catch (error) {
    console.error('CRON /api/attentes/cron erreur:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}