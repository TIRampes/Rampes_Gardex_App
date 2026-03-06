import { NextRequest, NextResponse } from 'next/server';
import { getReprisesActives, getReprisesHistorique, getStatsReprises } from '@/app/services/reprises.service';

// GET /api/reprises
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get('recherche') || '';
    const typeReprise = searchParams.get('typeReprise') || '';
    const priorite = searchParams.get('priorite') || '';
    const periode = searchParams.get('periode') || '';
    const statsPeriode = searchParams.get('statsPeriode') || '';
    const statsAnnee = searchParams.get('statsAnnee') || '';

    const filtres = {
      ...(recherche ? { recherche } : {}),
      ...(typeReprise ? { typeReprise } : {}),
      ...(priorite ? { priorite } : {}),
      ...(periode ? { periode } : {}),
    };

    const [actives, historique, stats] = await Promise.all([
      getReprisesActives(filtres),
      getReprisesHistorique({ recherche: recherche || undefined, typeReprise: typeReprise || undefined }),
      getStatsReprises({
        periode: statsPeriode || undefined,
        annee: statsAnnee ? parseInt(statsAnnee) : undefined,
      }),
    ]);

    return NextResponse.json({ actives, historique, stats });
  } catch (error) {
    console.error('GET /api/reprises erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}