import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { envoyerDelaisParCourriel } from '@/app/services/delais-email.service';
import { DELAIS_DEFAUT } from '@/app/api/achats/schema';

// POST /api/achats/delais/envoi — envoyer la liste des délais par courriel via Microsoft Graph
export async function POST(request: NextRequest) {
  try {
    // Charger la config depuis la BD
    const [delaisRow, rupturesRow, debutRow] = await Promise.all([
      prisma.configuration.findUnique({ where: { cle: 'achats_delais_livraison' } }),
      prisma.configuration.findUnique({ where: { cle: 'achats_ruptures_stock' } }),
      prisma.configuration.findUnique({ where: { cle: 'achats_debut_construction' } }),
    ]);

    const delais = delaisRow ? JSON.parse(delaisRow.valeur) : DELAIS_DEFAUT;
    const ruptures = rupturesRow ? JSON.parse(rupturesRow.valeur) : [];
    const debutConstruction = debutRow?.valeur || '';

    const result = await envoyerDelaisParCourriel(delais, ruptures, debutConstruction);

    return NextResponse.json({
      success: result.envoyes > 0,
      message: `${result.envoyes} email(s) envoyé(s) via Microsoft 365`,
      ...result,
    });
  } catch (error) {
    console.error('POST /api/achats/delais/envoi erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}