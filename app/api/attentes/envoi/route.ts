import { NextRequest, NextResponse } from 'next/server';
import { EnvoiAttenteFormSchema } from '@/app/api/attentes/schema';
import { getCommandesEnAttente, getRepresentantsActifs } from '@/app/services/attentes.service';
import { envoyerAttentesGroupees } from '@/app/services/email.service';

type Representant = {
  id: string;
  email?: string | null;
};

type RepresentantAvecEmail = {
  id: string;
  email: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = EnvoiAttenteFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { representantIds, notes } = parsed.data;

    const [commandes, representants] = await Promise.all([
      getCommandesEnAttente(),
      getRepresentantsActifs(),
    ]);

    // ✅ filtrage avec type final correct
    const repsValides: RepresentantAvecEmail[] = (representants as Representant[])
      .filter(
        (r): r is RepresentantAvecEmail =>
          representantIds.includes(r.id) && typeof r.email === 'string'
      );

    if (repsValides.length === 0) {
      return NextResponse.json(
        { error: 'Aucun représentant valide avec email trouvé' },
        { status: 400 }
      );
    }

    const result = await envoyerAttentesGroupees(
      repsValides.map((r) => r.id),
      commandes,
      repsValides,
      notes
    );

    return NextResponse.json({
      success: result.envoyes > 0,
      total: result.total,
      envoyes: result.envoyes,
      erreurs: result.erreurs,
    });

  } catch (error) {
    console.error('POST /api/attentes/envoi erreur:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}