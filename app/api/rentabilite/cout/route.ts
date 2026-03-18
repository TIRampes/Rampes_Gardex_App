import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CLE = 'rentabilite_cout_horaire';

export async function GET() {
  try {
    const config = await prisma.configuration.findUnique({ where: { cle: CLE } });
    const coutHoraire = config ? parseFloat(config.valeur) || 160 : 160;
    return NextResponse.json({ coutHoraire });
  } catch {
    return NextResponse.json({ coutHoraire: 160 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { coutHoraire } = await request.json();
    if (!coutHoraire || coutHoraire <= 0) return NextResponse.json({ error: 'Coût invalide' }, { status: 400 });

    await prisma.configuration.upsert({
      where: { cle: CLE },
      update: { valeur: String(coutHoraire) },
      create: { cle: CLE, valeur: String(coutHoraire), description: 'Coût horaire installation ($/h)' },
    });

    return NextResponse.json({ coutHoraire, message: 'Coût modifié' });
  } catch (error) {
    console.error('PUT /api/rentabilite/cout erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}