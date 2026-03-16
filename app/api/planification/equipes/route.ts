import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EquipeCreateSchema } from "@/app/api/planification/schema";
import type { EquipeView } from "@/app/api/planification/schema";

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

    const result: EquipeView[] = equipes.map((e) => ({
      id: e.id,
      nom: e.nom,
      couleur: e.couleur,
      actif: e.actif,
      membres: e.membres,
      nbPlanifications: e.planifications.length,
      heuresTotal: e.planifications.reduce((a, p) => a + ((p.commande as any)?.tempsEstimeInstallation || 0), 0),
    }));

    return NextResponse.json({ equipes: result });
  } catch (error) {
    console.error('GET equipes erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EquipeCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });

    const equipe = await prisma.equipe.create({ data: { nom: parsed.data.nom, couleur: parsed.data.couleur } });
    return NextResponse.json(equipe, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Ce nom d\'équipe existe déjà' }, { status: 400 });
    console.error('POST equipe erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}