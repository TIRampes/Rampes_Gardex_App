import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EquipeCreateSchema } from '@/app/api/planification/schema';

export async function GET() {
  try {
    const equipes = await prisma.equipe.findMany({
      where: { actif: true },
      include: {
        membres: { where: { actif: true }, select: { id: true, nom: true, prenom: true } },
        planifications: {
          where: { statut: { notIn: ['ANNULEE', 'COMPLETEE'] } },
          select: { id: true, commande: { select: { tempsEstimeInstallation: true } } },
        },
      },
      orderBy: { nom: 'asc' },
    });

    const result = equipes.map((e) => ({
      id: e.id,
      nom: e.nom,
      responsable: e.responsable || null,
      nbHeuresJour: e.nbHeuresJour ?? 8,
      couleur: e.couleur,
      actif: e.actif,
      membres: e.membres,
      nbPlanifications: e.planifications.length,
      heuresTotal: e.planifications.reduce(
        (acc, p) => acc + (p.commande?.tempsEstimeInstallation ?? 0),
        0
      ),
    }));

    return NextResponse.json({ equipes: result });
  } catch (error) {
    console.error('GET equipes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EquipeCreateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );

    const d = parsed.data;
    const equipe = await prisma.equipe.create({
      data: {
        nom: d.nom,
        responsable: d.responsable || null,
        nbHeuresJour: d.nbHeuresJour ?? 8,
        couleur: d.couleur,
      },
    });

    return NextResponse.json(equipe, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002')
      return NextResponse.json({ error: 'Ce nom existe déjà' }, { status: 400 });

    console.error('POST equipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}