import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: { id: string } };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params; // plus besoin d'await
    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.nom !== undefined) updateData.nom = body.nom;
    if (body.responsable !== undefined) updateData.responsable = body.responsable || null;
    if (body.nbHeuresJour !== undefined) updateData.nbHeuresJour = body.nbHeuresJour;
    if (body.couleur !== undefined) updateData.couleur = body.couleur;

    const equipe = await prisma.equipe.update({ where: { id }, data: updateData });
    return NextResponse.json(equipe);
  } catch (error) {
    console.error('PUT equipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params; // plus besoin d'await
    const existing = await prisma.equipe.findUnique({
      where: { id },
      include: { _count: { select: { planifications: true, interventions: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Non trouvée' }, { status: 404 });
    if (existing._count.planifications > 0 || existing._count.interventions > 0) {
      await prisma.equipe.update({ where: { id }, data: { actif: false } });
      return NextResponse.json({ message: 'Désactivée' });
    }
    await prisma.equipe.delete({ where: { id } });
    return NextResponse.json({ message: 'Supprimée' });
  } catch (error) {
    console.error('DELETE equipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}