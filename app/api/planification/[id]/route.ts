import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlanificationUpdateSchema } from "@/app/api/planification/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = PlanificationUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });

    const existing = await prisma.planification.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Planification non trouvée' }, { status: 404 });

    const d = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (d.equipeId !== undefined) updateData.equipeId = d.equipeId;
    if (d.datePlanifiee !== undefined) updateData.datePlanifiee = new Date(d.datePlanifiee);
    if (d.heureDebut !== undefined) updateData.heureDebut = d.heureDebut || null;
    if (d.heureFin !== undefined) updateData.heureFin = d.heureFin || null;
    if (d.clientPresent !== undefined) updateData.clientPresent = d.clientPresent;
    if (d.representantPresent !== undefined) updateData.representantPresent = d.representantPresent;
    if (d.envoyerAvis !== undefined) updateData.envoyerAvis = d.envoyerAvis;
    if (d.avisEnvoye !== undefined) updateData.avisEnvoye = d.avisEnvoye;
    if (d.statut !== undefined) updateData.statut = d.statut;
    if (d.notes !== undefined) updateData.notes = d.notes || null;

    const planif = await prisma.planification.update({ where: { id }, data: updateData });

    // Sync datePrevue sur commande si date modifiée
    if (d.datePlanifiee) {
      await prisma.commande.update({
        where: { id: existing.commandeId },
        data: { datePrevue: new Date(d.datePlanifiee) },
      });
    }

    return NextResponse.json(planif);
  } catch (error) {
    console.error('PUT /api/planification/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.planification.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Planification non trouvée' }, { status: 404 });

    await prisma.planification.delete({ where: { id } });
    return NextResponse.json({ message: 'Planification supprimée' });
  } catch (error) {
    console.error('DELETE /api/planification/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}