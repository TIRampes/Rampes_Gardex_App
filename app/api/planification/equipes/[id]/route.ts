import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.equipe.findUnique({
      where: { id },
      include: { _count: { select: { planifications: true, interventions: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });

    if (existing._count.planifications > 0 || existing._count.interventions > 0) {
      await prisma.equipe.update({ where: { id }, data: { actif: false } });
      return NextResponse.json({ message: 'Équipe désactivée (planifications/interventions liées)' });
    }

    await prisma.equipe.delete({ where: { id } });
    return NextResponse.json({ message: 'Équipe supprimée' });
  } catch (error) {
    console.error('DELETE equipe erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}