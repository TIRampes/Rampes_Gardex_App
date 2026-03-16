import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/interventions/[id]/completer
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await prisma.intervention.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });

    const intervention = await prisma.intervention.update({
      where: { id },
      data: {
        statut: 'COMPLETEE',
        formulaireComplete: true,
      },
    });

    return NextResponse.json({ message: 'Intervention complétée', intervention });
  } catch (error) {
    console.error('POST /api/interventions/[id]/completer erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}