// app/api/planification/equipes/calendrier/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await prisma.equipeHeureSemaine.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Entrée supprimée avec succès" });
  } catch (error) {
    console.error("Erreur DELETE calendrier:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}