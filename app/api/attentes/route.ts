// app/api/attentes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CodeProduction } from '@prisma/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const representants = searchParams.getAll('representant'); // peut être multiple

  try {
    // Définir les codes correspondant à une attente
    const attenteCodes: CodeProduction[] = [
      'ATTENTE_CLIENT',
      'ATTENTE_REPRESENTANT',
      'ATTENTE_CAROL_CONFIRM',
      'ATTENTE_CAROL_MESURE',
      'BACK_ORDER',
    ];

    // Construire le filtre OR pour tous les champs concernés
    const where: any = {
      OR: [
        { mesure: { in: attenteCodes } },
        { plan: { in: attenteCodes } },
        { envoyeProduction: { in: attenteCodes } },
        { productionTerminee: { in: attenteCodes } },
        { termine: { in: attenteCodes } },
      ],
    };

    // Filtrer par représentant si fourni
    if (representants.length > 0) {
      where.representantId = { in: representants };
    }

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        representant: true,
        client: true,
      },
      orderBy: { dateEntree: 'desc' },
    });

    return NextResponse.json(commandes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des attentes' },
      { status: 500 }
    );
  }
}