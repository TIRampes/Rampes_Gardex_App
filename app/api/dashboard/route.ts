import { NextResponse,NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const debutMois = new Date(today.getFullYear(), today.getMonth(), 1);

    // Stats commandes en parallèle
    const [
      totalCommandes,
      commandesActives,
      commandesEnAttente,
      commandesCompletees,
      commandesEnProduction,
      commandesEnRetard,
      totalClients,
      nouveauxClientsMois,
      reprisesEnCours,
      chiffreAffairesMois,
    ] = await Promise.all([
      prisma.commande.count(),
      prisma.commande.count({ where: { statut: "ACTIVE" } }),
      prisma.commande.count({ where: { statut: "EN_ATTENTE" } }),
      prisma.commande.count({ where: { statut: "COMPLETEE" } }),
      prisma.commande.count({ where: { enProduction: true } }),
      prisma.commande.count({
        where: { statut: "ACTIVE", datePrevue: { lt: today } },
      }),
      prisma.client.count({ where: { actif: true } }),
      prisma.client.count({
        where: { actif: true, createdAt: { gte: debutMois } },
      }),
      prisma.reprise.count({ where: { completee: false } }),
      prisma.commande.aggregate({
        where: { dateEntree: { gte: debutMois }, statut: { not: "ANNULEE" } },
        _sum: { prixTotal: true },
      }),
    ]);

    // Stats par type de commande
    const commandesParType = await prisma.commande.groupBy({
      by: ["typeCommande"],
      _count: true,
      where: { statut: { not: "ANNULEE" } },
    });

    // Stats par service (pour commandes actives)
    const commandesParService = await prisma.commande.groupBy({
      by: ["service"],
      _count: true,
      where: { statut: "ACTIVE" },
    });

    // Interventions aujourd'hui
    const interventionsAujourdhui = await prisma.intervention.findMany({
      where: {
        datePrevue: { gte: today, lt: tomorrow },
      },
      include: {
        commande: {
          include: {
            client: { select: { nom: true, telephone: true, personne_Contact: true } },
          },
        },
        equipe: { select: { nom: true, couleur: true } },
      },
      orderBy: { heureDebut: "asc" },
    });

    // Prochaines interventions (7 jours)
    const prochainesInterventions = await prisma.intervention.findMany({
      where: {
        datePrevue: { gte: today, lte: nextWeek },
        statut: { in: ["PLANIFIEE", "EN_COURS"] },
      },
      include: {
        commande: {
          include: {
            client: { select: { nom: true, telephone: true, personne_Contact: true } },
          },
        },
        equipe: { select: { nom: true, couleur: true } },
      },
      orderBy: { datePrevue: "asc" },
      take: 10,
    });

    // Commandes récentes
    const commandesRecentes = await prisma.commande.findMany({
      where: { statut: "ACTIVE" },
      include: {
        client: { select: { nom: true, type: true, telephone: true } },
        representant: { select: { nom: true } },
      },
      orderBy: { dateEntree: "desc" },
      take: 6,
    });

    // Alertes
    const alertes = [];
    
    if (commandesEnRetard > 0) {
      alertes.push({
        type: "warning",
        title: `${commandesEnRetard} commande${commandesEnRetard > 1 ? 's' : ''} en retard`,
        description: "Date prévue dépassée",
        link: "/dashboard/commandes?statut=ACTIVE",
      });
    }

    if (reprisesEnCours > 0) {
      alertes.push({
        type: "error",
        title: `${reprisesEnCours} reprise${reprisesEnCours > 1 ? 's' : ''} en cours`,
        description: "Nécessite attention",
        link: "/dashboard/reprises",
      });
    }

    if (commandesEnAttente > 3) {
      alertes.push({
        type: "info",
        title: `${commandesEnAttente} commandes en attente`,
        description: "En attente de traitement",
        link: "/dashboard/commandes?statut=EN_ATTENTE",
      });
    }

    return NextResponse.json({
      stats: {
        commandes: {
          total: totalCommandes,
          actives: commandesActives,
          enAttente: commandesEnAttente,
          completees: commandesCompletees,
          enProduction: commandesEnProduction,
          enRetard: commandesEnRetard,
        },
        parType: commandesParType.reduce((acc, item) => {
          acc[item.typeCommande] = item._count;
          return acc;
        }, {} as Record<string, number>),
        parService: commandesParService.reduce((acc, item) => {
          acc[item.service] = item._count;
          return acc;
        }, {} as Record<string, number>),
        clients: {
          total: totalClients,
          nouveaux: nouveauxClientsMois,
        },
        reprises: reprisesEnCours,
        chiffreAffaires: Number(chiffreAffairesMois._sum.prixTotal || 0),
      },
      interventions: {
        aujourdhui: interventionsAujourdhui,
        prochaines: prochainesInterventions,
      },
      commandesRecentes,
      alertes,
    });
  } catch (error) {
    console.error("Erreur Dashboard API:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}