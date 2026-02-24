import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ProductionQuerySchema,
  UpdateProductionSchema,
  MettreEnProductionSchema,
  RetirerProductionSchema,
  TerminerProductionSchema,
  UpdateAchatProductionSchema,
} from "@/app/dashboard/production/schema";

// ╔══════════════════════════════════════════════════════════╗
// ║        GET /api/production                              ║
// ║  Récupère les commandes pour le module production       ║
// ╚══════════════════════════════════════════════════════════╝

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = ProductionQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    // Construction du where dynamique
    const where: any = {};

where.statut = params.statut ?? "ACTIVE";

if (params.service) {
  where.service = params.service;
}

if (params.enProduction !== undefined) {
  if (params.enProduction) {
  where.envoyeProduction = "COMPLETE";
}
}

if (params.productionTerminee !== undefined) {
  if (params.productionTerminee) {
    where.productionTerminee = "COMPLETE";
  } else {
    where.productionTerminee = null;
  }
}


    if (params.recherche) {
      where.OR = [
        { numero: { contains: params.recherche } },
        { client: { nom: { contains: params.recherche } } },
        { reference: { contains: params.recherche } },
        { adresse: { contains: params.recherche } },
      ];
    }

    const skip = (params.page - 1) * params.limite;

    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        include: {
          client: { select: { id: true, nom: true } },
          representant: { select: { id: true, nom: true } },
          planifications: {
            include: { equipe: { select: { nom: true, couleur: true } } },
            orderBy: { datePlanifiee: "desc" },
            take: 1,
          },
        },
        orderBy: [{ dateProduction: "asc" }, { datePrevue: "asc" }],
        skip,
        take: params.limite,
      }),
      prisma.commande.count({ where }),
    ]);

    // Transformer pour l'UI
    const data = commandes.map((cmd) => ({
      id: cmd.id,
      numero: cmd.numero,
      clientNom: cmd.client.nom,
      clientId: cmd.clientId,
      representantNom: cmd.representant?.nom ?? null,
      reference: cmd.reference,
      service: cmd.service,
      typeCommande: cmd.typeCommande,
      statut: cmd.statut,
      adresse: cmd.adresse,
      couleur: cmd.couleur,
      couleurPersonnalisee: cmd.couleurPersonnalisee,
      reprise: cmd.reprise,
      dateEntree: cmd.dateEntree.toISOString(),
      datePrevue: cmd.datePrevue?.toISOString() ?? null,
      dateProduction: cmd.dateProduction?.toISOString() ?? null,
      datePriseMesure: cmd.datePriseMesure?.toISOString() ?? null,
      dateLivraison: cmd.dateLivraison?.toISOString() ?? null,
      enProduction: cmd.enProduction,
      structure: cmd.structure,
      mesure: cmd.mesure,
      mesureDonneeLe: cmd.mesureDonneeLe?.toISOString() ?? null,
      plan: cmd.plan,
      envoyeProduction: cmd.envoyeProduction,
      productionTerminee: cmd.productionTerminee,
      termine: cmd.termine,
      installation: cmd.installation,
      statutLivraison: cmd.statutLivraison,
      piedsLineairesRampes: cmd.piedsLineairesRampes,
      nombrePoteaux: cmd.nombrePoteaux,
      tempsEstimeInstallation: cmd.tempsEstimeInstallation,
      piedsCarresFibre: cmd.piedsCarresFibre,
      piedsLineairesBarrotin: cmd.piedsLineairesBarrotin,
      piedsLineairesVerre: cmd.piedsLineairesVerre,
      piedsLineairesMur: cmd.piedsLineairesMur,
      piedsLineairesMainDouble: cmd.piedsLineairesMainDouble,
      piedsLineairesGardexVision: cmd.piedsLineairesGardexVision,
      piedsLineairesGardexUrbaine: cmd.piedsLineairesGardexUrbaine,
      piedsLineairesGardexOptimum: cmd.piedsLineairesGardexOptimum,
      achatFibre: cmd.achatFibre,
      achatLimons: cmd.achatLimons,
      achatVerres: cmd.achatVerres,
      achatColonnes: cmd.achatColonnes,
      achatPeinture: cmd.achatPeinture,
      achatAttaches: cmd.achatAttaches,
      achatPlancherAluminium: cmd.achatPlancherAluminium,
      commentaire: cmd.commentaire,
      equipeNom: cmd.planifications[0]?.equipe?.nom ?? null,
      clientPresent: cmd.clientPresent,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page: params.page,
        limite: params.limite,
        total,
        totalPages: Math.ceil(total / params.limite),
      },
    });
  } catch (error) {
    console.error("[API/production GET]", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Paramètres invalides", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║        PATCH /api/production                            ║
// ║  Mise à jour des champs production d'une commande       ║
// ╚══════════════════════════════════════════════════════════╝

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = UpdateProductionSchema.parse(body);

    const { commandeId, ...updateData } = data;

    // Nettoyer les champs undefined
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }

    // Si on met envoyeProduction à COMPLETE, mettre aussi enProduction à true
    if (cleanData.envoyeProduction === "COMPLETE") {
      cleanData.enProduction = true;
    }

    const commande = await prisma.commande.update({
      where: { id: commandeId },
      data: cleanData,
      include: {
        client: { select: { nom: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: commande.id,
        numero: commande.numero,
        clientNom: commande.client.nom,
        envoyeProduction: commande.envoyeProduction,
        productionTerminee: commande.productionTerminee,
        enProduction: commande.enProduction,
      },
    });
  } catch (error) {
    console.error("[API/production PATCH]", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║        POST /api/production                             ║
// ║  Actions: mettre-en-production / retirer / terminer     ║
// ╚══════════════════════════════════════════════════════════╝

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "mettre-en-production": {
        const data = MettreEnProductionSchema.parse(body);
        const results = await prisma.$transaction(
          data.commandeIds.map((id) =>
            prisma.commande.update({
              where: { id },
              data: {
                envoyeProduction: "COMPLETE",
                enProduction: true,
                dateProduction: data.dateProduction,
              },
            })
          )
        );
        return NextResponse.json({
          success: true,
          message: `${results.length} commande(s) mise(s) en production`,
          count: results.length,
        });
      }

      case "retirer": {
        const data = RetirerProductionSchema.parse(body);
        await prisma.commande.update({
          where: { id: data.commandeId },
          data: {
            envoyeProduction: null,
            enProduction: false,
            dateProduction: null,
          },
        });
        return NextResponse.json({ success: true, message: "Commande retirée de la production" });
      }

      case "terminer": {
        const data = TerminerProductionSchema.parse(body);
        await prisma.commande.update({
          where: { id: data.commandeId },
          data: {
            productionTerminee: "COMPLETE",
            enProduction: false,
          },
        });
        return NextResponse.json({ success: true, message: "Production terminée" });
      }

      case "update-achat": {
        const data = UpdateAchatProductionSchema.parse(body);
        const updateObj: Record<string, unknown> = {
          [data.champ]: data.valeur,
        };
        // Mapper les champs dates associés
        const champDateMap: Record<string, { envoie: string; reception: string; qte: string }> = {
          achatFibre:              { envoie: "dateEnvoieFibre",              reception: "dateReceptionFibre",              qte: "quantiteNonRecueFibre" },
          achatLimons:             { envoie: "dateEnvoieLimons",             reception: "dateReceptionLimons",             qte: "quantiteNonRecueLimons" },
          achatVerres:             { envoie: "dateEnvoieVerres",             reception: "dateReceptionVerre",              qte: "quantiteNonRecueVerres" },
          achatColonnes:           { envoie: "dateEnvoieColonnes",           reception: "dateReceptionColonnes",           qte: "quantiteNonRecueColonnes" },
          achatPeinture:           { envoie: "dateEnvoiePeinture",           reception: "dateReceptionPeinture",           qte: "quantiteNonRecuePeinture" },
          achatAttaches:           { envoie: "dateEnvoieAttaches",           reception: "dateReceptionAttaches",           qte: "quantiteNonRecueAttaches" },
          achatPlancherAluminium:  { envoie: "dateEnvoiePlancherAluminium",  reception: "dateReceptionPlancherAluminium",  qte: "quantiteNonRecuePlancherAluminium" },
        };
        const mapping = champDateMap[data.champ];
        if (mapping) {
          if (data.dateEnvoie !== undefined) updateObj[mapping.envoie] = data.dateEnvoie;
          if (data.dateReception !== undefined) updateObj[mapping.reception] = data.dateReception;
          if (data.quantiteNonRecue !== undefined) updateObj[mapping.qte] = data.quantiteNonRecue;
        }
        await prisma.commande.update({ where: { id: data.commandeId }, data: updateObj });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (error) {
    console.error("[API/production POST]", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}