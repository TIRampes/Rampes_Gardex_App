// ============================================================
// app/api/multilogements/[id]/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commandeId } = await context.params;

    if (!commandeId) {
      return NextResponse.json(
        { error: "ID commande manquant" },
        { status: 400 }
      );
    }

    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            ville: true,
            telephone: true,
            personne_Contact: true,
          },
        },
        representant: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
          },
        },
        balcons: {
          orderBy: [
            { numeroPhase: "asc" },
            { nom: "asc" }
          ],
        },
        achatPhases: {
          orderBy: { phaseNumero: "asc" },
        },
        productions: {
          orderBy: { dateProduction: "desc" },
          take: 10,
        },
        planifications: {
          orderBy: { datePlanifiee: "desc" },
          take: 10,
          include: {
            equipe: {
              select: {
                id: true,
                nom: true,
                couleur: true,
              },
            },
          },
        },
      },
    });

    if (!commande) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    if (
      !["COMMERCIAL", "MULTI_PHASE", "MULTIPLAN"].includes(
        commande.typeCommande
      )
    ) {
      return NextResponse.json(
        { error: "Pas une commande multi-logements" },
        { status: 400 }
      );
    }

    const totalBalcons = commande.balcons.length;

    const balconsTermines = commande.balcons.filter(
      (b) => b.installationTerminee
    ).length;

    const pourcentage =
      totalBalcons > 0
        ? Math.round((balconsTermines / totalBalcons) * 100)
        : 0;

    const progression = {
      totalBalcons,
      balconsTermines,
      pourcentage,
    };

    return NextResponse.json({
      commande,
      progression,
    });

  } catch (error) {
    console.error("Erreur API détail commande:", error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}