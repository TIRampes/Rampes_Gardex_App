import { NextResponse } from 'next/server';
import {
  getCommandesEnAttente,
  getStatsAttentes,
  getRepresentantsActifs,
} from '@/app/services/attentes.service';

// GET /api/attentes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const representantIds =
      searchParams.get('representantIds')
        ?.split(',')
        .filter(Boolean) ?? [];

    const recherche = searchParams.get('recherche') ?? '';

    const filtres = {
      ...(representantIds.length > 0 ? { representantIds } : {}),
      ...(recherche ? { recherche } : {}),
    };

    const [commandes, representants] = await Promise.all([
      getCommandesEnAttente(filtres),
      getRepresentantsActifs(),
    ]);

    const stats = await getStatsAttentes(commandes);

    return NextResponse.json({
      commandes,
      representants,
      stats,
    });
  } catch (error) {
    console.error('GET /api/attentes erreur:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}