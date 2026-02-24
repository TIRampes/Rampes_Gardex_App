import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CalendrierQuerySchema } from "@/app/dashboard/production/schema";

// ╔══════════════════════════════════════════════════════════╗
// ║    GET /api/production/calendrier                       ║
// ║    Commandes en production groupées par date du mois    ║
// ╚══════════════════════════════════════════════════════════╝

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = CalendrierQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    const startDate = new Date(params.annee, params.mois, 1);
    const endDate = new Date(params.annee, params.mois + 1, 0, 23, 59, 59);

    // Récupérer toutes les commandes en production pour le mois
    const commandes = await prisma.commande.findMany({
      where: {
        envoyeProduction: "COMPLETE",
        productionTerminee: { not: "COMPLETE" },
        dateProduction: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: { select: { id: true, nom: true } },
        representant: { select: { nom: true } },
        planifications: {
          include: { equipe: { select: { nom: true, couleur: true } } },
          orderBy: { datePlanifiee: "desc" },
          take: 1,
        },
      },
      orderBy: { dateProduction: "asc" },
    });

    // Grouper par date (YYYY-MM-DD)
    const grouped: Record<
      string,
      {
        commandes: typeof formattedCommandes;
        totaux: { count: number; piedsLineaires: number; poteaux: number };
      }
    > = {};

    const formattedCommandes = commandes.map((cmd) => ({
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
      datePriseMesure: cmd.datePriseMesure?.toISOString() ?? null,
      piedsLineairesRampes: cmd.piedsLineairesRampes,
      nombrePoteaux: cmd.nombrePoteaux,
      tempsEstimeInstallation: cmd.tempsEstimeInstallation,
      mesure: cmd.mesure,
      plan: cmd.plan,
      envoyeProduction: cmd.envoyeProduction,
      productionTerminee: cmd.productionTerminee,
      commentaire: cmd.commentaire,
      equipeNom: cmd.planifications[0]?.equipe?.nom ?? null,
    }));

    for (const cmd of formattedCommandes) {
      if (!cmd.dateProduction) continue;
      const dateKey = cmd.dateProduction.split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          commandes: [],
          totaux: { count: 0, piedsLineaires: 0, poteaux: 0 },
        };
      }
      grouped[dateKey].commandes.push(cmd);
      grouped[dateKey].totaux.count++;
      grouped[dateKey].totaux.piedsLineaires += cmd.piedsLineairesRampes;
      grouped[dateKey].totaux.poteaux += cmd.nombrePoteaux;
    }

    // Totaux globaux du mois
    const totauxMois = {
      commandes: commandes.length,
      piedsLineaires: commandes.reduce((sum, c) => sum + c.piedsLineairesRampes, 0),
      poteaux: commandes.reduce((sum, c) => sum + c.nombrePoteaux, 0),
    };

    return NextResponse.json({
      mois: params.mois,
      annee: params.annee,
      jours: grouped,
      totaux: totauxMois,
    });
  } catch (error) {
    console.error("[API/production/calendrier]", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}