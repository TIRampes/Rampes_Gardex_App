import { NextRequest, NextResponse } from 'next/server';
import { EnvoiAttenteFormSchema } from '@/app/api/attentes/schema';
import { getCommandesEnAttente, getRepresentantsActifs } from '@/app/services/attentes.service';
import { envoyerAttentesGroupees } from '@/app/services/email.service';

// Typage complet attendu par envoyerAttentesGroupees
type RepresentantComplet = {
  id: string;
  nom: string;
  actif: boolean;
  email: string;
  telephone?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EnvoiAttenteFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { representantIds, notes } = parsed.data;

    const [commandes, representants] = await Promise.all([
      getCommandesEnAttente(),
      getRepresentantsActifs(),
    ]);

    // Filtrer et transformer en objets complets
    const repsValides: RepresentantComplet[] = (representants as any[])
      .filter(r => representantIds.includes(r.id) && typeof r.email === 'string' && r.nom && typeof r.actif === 'boolean')
      .map(r => ({
        id: r.id,
        nom: r.nom,
        actif: r.actif,
        email: r.email,
        telephone: r.telephone ?? null,
      }));

    if (repsValides.length === 0) {
      return NextResponse.json(
        { error: 'Aucun représentant valide avec email trouvé' },
        { status: 400 }
      );
    }

    const result = await envoyerAttentesGroupees(
      repsValides.map(r => r.id),
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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}