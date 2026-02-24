import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatistiquesQuerySchema } from "@/app/dashboard/production/schema";

// ╔══════════════════════════════════════════════════════════╗
// ║    GET /api/production/statistiques                     ║
// ║    Statistiques de production par période                ║
// ╚══════════════════════════════════════════════════════════╝

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = StatistiquesQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    const now = new Date();
    let dateDebut: Date;
    let dateFin: Date;

    switch (params.periode) {
      case "journalier":
        dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        dateFin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case "hebdomadaire": {
        const dayOfWeek = now.getDay();
        dateDebut = new Date(now);
        dateDebut.setDate(now.getDate() - dayOfWeek);
        dateDebut.setHours(0, 0, 0, 0);
        dateFin = new Date(dateDebut);
        dateFin.setDate(dateDebut.getDate() + 6);
        dateFin.setHours(23, 59, 59, 999);
        break;
      }
      case "mensuel": {
        const mois = params.mois ?? now.getMonth();
        const annee = params.annee ?? now.getFullYear();
        dateDebut = new Date(annee, mois, 1);
        dateFin = new Date(annee, mois + 1, 0, 23, 59, 59);
        break;
      }
      case "annuel": {
        const annee = params.annee ?? now.getFullYear();
        dateDebut = new Date(annee, 0, 1);
        dateFin = new Date(annee, 11, 31, 23, 59, 59);
        break;
      }
    }

    // Commandes en production pour la période
    const commandesPeriode = await prisma.commande.findMany({
      where: {
        envoyeProduction: "COMPLETE",
        dateProduction: { gte: dateDebut, lte: dateFin },
      },
      select: {
        id: true,
        service: true,
        piedsLineairesRampes: true,
        nombrePoteaux: true,
        dateProduction: true,
        productionTerminee: true,
      },
    });

    // Compteurs globaux (pas limités à la période)
    const [enProduction, terminees, enAttente] = await Promise.all([
      prisma.commande.count({
        where: { envoyeProduction: "COMPLETE", productionTerminee: { not: "COMPLETE" } },
      }),
      prisma.commande.count({
        where: { productionTerminee: "COMPLETE" },
      }),
      prisma.commande.count({
        where: { statut: "ACTIVE", envoyeProduction: { not: "COMPLETE" } },
      }),
    ]);

    // Agrégation par jour
    const parJourMap: Record<string, { commandes: number; piedsLineaires: number; poteaux: number }> = {};
    for (const cmd of commandesPeriode) {
      if (!cmd.dateProduction) continue;
      const dateKey = cmd.dateProduction.toISOString().split("T")[0];
      if (!parJourMap[dateKey]) {
        parJourMap[dateKey] = { commandes: 0, piedsLineaires: 0, poteaux: 0 };
      }
      parJourMap[dateKey].commandes++;
      parJourMap[dateKey].piedsLineaires += cmd.piedsLineairesRampes;
      parJourMap[dateKey].poteaux += cmd.nombrePoteaux;
    }

    const parJour = Object.entries(parJourMap)
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Agrégation par service
    const parServiceMap: Record<string, number> = {};
    for (const cmd of commandesPeriode) {
      parServiceMap[cmd.service] = (parServiceMap[cmd.service] || 0) + 1;
    }
    const parService = Object.entries(parServiceMap).map(([service, count]) => ({
      service,
      count,
    }));

    // Agrégation par semaine (pour graphique)
    const parSemaineMap: Record<string, { commandes: number; piedsLineaires: number }> = {};
    for (const cmd of commandesPeriode) {
      if (!cmd.dateProduction) continue;
      const d = new Date(cmd.dateProduction);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      if (!parSemaineMap[weekKey]) {
        parSemaineMap[weekKey] = { commandes: 0, piedsLineaires: 0 };
      }
      parSemaineMap[weekKey].commandes++;
      parSemaineMap[weekKey].piedsLineaires += cmd.piedsLineairesRampes;
    }
    const parSemaine = Object.entries(parSemaineMap)
      .map(([semaine, vals]) => ({ semaine, ...vals }))
      .sort((a, b) => a.semaine.localeCompare(b.semaine));

    return NextResponse.json({
      periode: params.periode,
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
      totaux: {
        totalCommandes: commandesPeriode.length,
        piedsLineaires: commandesPeriode.reduce((s, c) => s + c.piedsLineairesRampes, 0),
        poteaux: commandesPeriode.reduce((s, c) => s + c.nombrePoteaux, 0),
        enProduction,
        terminees,
        enAttente,
      },
      parJour,
      parSemaine,
      parService,
    });
  } catch (error) {
    console.error("[API/production/statistiques]", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}