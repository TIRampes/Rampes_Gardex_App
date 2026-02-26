import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CalendrierPlanifQuerySchema } from "@/app/api/planification/schema";

// GET /api/planification/calendrier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = CalendrierPlanifQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const startDate = new Date(params.annee, params.mois, 1);
    const endDate = new Date(params.annee, params.mois + 1, 0, 23, 59, 59);

    const where: Record<string, unknown> = {
      statut: "ACTIVE",
      datePrevue: { gte: startDate, lte: endDate },
      service: { in: ["INSTALLATION", "LIVRAISON", "CUEILLETTE", "TRANSPORT"] },
    };

    if (params.equipeId) {
      where.planifications = { some: { equipeId: params.equipeId } };
    }

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        client: { select: { id: true, nom: true } },
        representant: { select: { nom: true } },
        planifications: {
          include: { equipe: { select: { id: true, nom: true, couleur: true } } },
          orderBy: { datePlanifiee: "desc" },
          take: 1,
        },
      },
      orderBy: { datePrevue: "asc" },
    });

    const data = commandes.map((cmd) => {
      const planif = cmd.planifications[0] ?? null;
      return {
        id: cmd.id,
        numero: cmd.numero,
        clientNom: cmd.client.nom,
        reference: cmd.reference,
        service: cmd.service,
        typeCommande: cmd.typeCommande,
        adresse: cmd.adresse,
        couleur: cmd.couleur,
        reprise: cmd.reprise,
        datePrevue: cmd.datePrevue?.toISOString() ?? null,
        dateProduction: cmd.dateProduction?.toISOString() ?? null,
        mesure: cmd.mesure,
        plan: cmd.plan,
        envoyeProduction: cmd.envoyeProduction,
        productionTerminee: cmd.productionTerminee,
        piedsLineairesRampes: cmd.piedsLineairesRampes,
        nombrePoteaux: cmd.nombrePoteaux,
        tempsEstimeInstallation: cmd.tempsEstimeInstallation,
        equipeId: planif?.equipe?.id ?? null,
        equipeNom: planif?.equipe?.nom ?? null,
        equipeCouleur: planif?.equipe?.couleur ?? null,
        planificationId: planif?.id ?? null,
        planificationStatut: planif?.statut ?? null,
        clientPresent: planif?.clientPresent ?? cmd.clientPresent,
        representantPresent: planif?.representantPresent ?? false,
        commentaire: cmd.commentaire,
      };
    });

    return NextResponse.json({ mois: params.mois, annee: params.annee, data });
  } catch (error) {
    console.error("[API/planification/calendrier]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}