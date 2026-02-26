import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PlanificationQuerySchema,
  CreerPlanificationSchema,
  UpdatePlanificationSchema,
  EditInstallationSchema,
  TerminerInstallationSchema,
  ReporterInstallationSchema,
} from "@/app/api/planification/schema";

// ╔══════════════════════════════════════════════════════════════╗
// ║        GET /api/planification                               ║
// ║  Commandes pour la vue planification (planifiées + non)     ║
// ╚══════════════════════════════════════════════════════════════╝

const PLANIF_INCLUDE = {
  client: { select: { id: true, nom: true } },
  representant: { select: { id: true, nom: true } },
  planifications: {
    include: { equipe: { select: { id: true, nom: true, couleur: true } } },
    orderBy: { datePlanifiee: "desc" as const },
    take: 1,
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = PlanificationQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const where: Record<string, unknown> = { statut: "ACTIVE" };

    // Filtre service
    if (params.type === "installation") {
      where.service = "INSTALLATION";
    }

    // Filtre type commande
    if (params.typeCommande !== "tous") {
      const mapping: Record<string, string> = {
        standard: "STANDARD",
        commercial: "COMMERCIAL",
        multiplan: "MULTIPLAN",
        multiphase: "MULTI_PHASE",
      };
      where.typeCommande = mapping[params.typeCommande];
    }

    // Non planifiées uniquement
    if (params.nonPlanifiees) {
      where.productionTerminee = "COMPLETE";
      where.OR = [
        { planifications: { none: {} } },
        { datePrevue: null },
      ];
    }

    // Recherche
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
        include: PLANIF_INCLUDE,
        orderBy: [{ datePrevue: "asc" }, { dateEntree: "asc" }],
        skip,
        take: params.limite,
      }),
      prisma.commande.count({ where }),
    ]);

    const data = commandes.map((cmd) => {
      const planif = cmd.planifications[0] ?? null;
      return {
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
        reprise: cmd.reprise,
        dateEntree: cmd.dateEntree.toISOString(),
        datePrevue: cmd.datePrevue?.toISOString() ?? null,
        dateProduction: cmd.dateProduction?.toISOString() ?? null,
        datePriseMesure: cmd.datePriseMesure?.toISOString() ?? null,
        mesure: cmd.mesure,
        plan: cmd.plan,
        envoyeProduction: cmd.envoyeProduction,
        productionTerminee: cmd.productionTerminee,
        achatFibre: cmd.achatFibre,
        achatLimons: cmd.achatLimons,
        achatVerres: cmd.achatVerres,
        achatColonnes: cmd.achatColonnes,
        achatPeinture: cmd.achatPeinture,
        achatAttaches: cmd.achatAttaches,
        achatPlancherAluminium: cmd.achatPlancherAluminium,
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
        envoyerAvis: planif?.envoyerAvis ?? false,
        avisEnvoye: planif?.avisEnvoye ?? false,
        heureDebut: planif?.heureDebut ?? null,
        heureFin: planif?.heureFin ?? null,
        commentaire: cmd.commentaire,
      };
    });

    return NextResponse.json({ data, pagination: { page: params.page, limite: params.limite, total, totalPages: Math.ceil(total / params.limite) } });
  } catch (error) {
    console.error("[API/planification GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║   POST /api/planification — Actions multiples               ║
// ╚══════════════════════════════════════════════════════════════╝

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ── Créer planification ──
      case "creer": {
        const data = CreerPlanificationSchema.parse(body);
        const planif = await prisma.planification.create({
          data: {
            commandeId: data.commandeId,
            equipeId: data.equipeId,
            datePlanifiee: data.datePlanifiee,
            heureDebut: data.heureDebut ?? null,
            heureFin: data.heureFin ?? null,
            clientPresent: data.clientPresent,
            representantPresent: data.representantPresent,
            envoyerAvis: data.envoyerAvis,
            notes: data.notes ?? null,
            statut: "PLANIFIEE",
          },
        });
        // Mettre à jour la commande aussi
        await prisma.commande.update({
          where: { id: data.commandeId },
          data: {
            datePrevue: data.datePlanifiee,
            clientPresent: data.clientPresent,
          },
        });
        return NextResponse.json({ success: true, data: planif });
      }

      // ── Terminer installation ──
      case "terminer": {
        const data = TerminerInstallationSchema.parse(body);
        await prisma.$transaction([
          prisma.commande.update({
            where: { id: data.commandeId },
            data: { statut: "COMPLETEE", dateCompletion: new Date() },
          }),
          ...(data.planificationId
            ? [
                prisma.planification.update({
                  where: { id: data.planificationId },
                  data: { statut: "COMPLETEE" },
                }),
              ]
            : []),
        ]);
        return NextResponse.json({ success: true, message: "Installation terminée" });
      }

      // ── Reporter installation ──
      case "reporter": {
        const data = ReporterInstallationSchema.parse(body);
        const planif = await prisma.planification.update({
          where: { id: data.planificationId },
          data: {
            datePlanifiee: data.nouvelleDatePlanifiee,
            statut: "REPORTEE",
            notes: data.raison ?? null,
          },
        });
        // Mettre à jour la date prévue de la commande
        await prisma.commande.update({
          where: { id: planif.commandeId },
          data: { datePrevue: data.nouvelleDatePlanifiee },
        });
        return NextResponse.json({ success: true, message: "Installation reportée" });
      }

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (error) {
    console.error("[API/planification POST]", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║   PATCH /api/planification — Mise à jour                    ║
// ╚══════════════════════════════════════════════════════════════╝

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Édition directe de la commande (date, équipe, temps)
    if (body.commandeId && !body.planificationId) {
      const data = EditInstallationSchema.parse(body);
      const { commandeId, equipeId, ...rest } = data;

      const updateData: Record<string, unknown> = {};
      if (rest.datePrevue !== undefined) updateData.datePrevue = rest.datePrevue;
      if (rest.tempsEstimeInstallation !== undefined)
        updateData.tempsEstimeInstallation = rest.tempsEstimeInstallation;

      const commande = await prisma.commande.update({
        where: { id: commandeId },
        data: updateData,
      });

      // Si equipeId fourni, mettre à jour ou créer la planification
      if (equipeId !== undefined) {
        const existing = await prisma.planification.findFirst({
          where: { commandeId },
          orderBy: { createdAt: "desc" },
        });
        if (existing) {
          await prisma.planification.update({
            where: { id: existing.id },
            data: { equipeId: equipeId ?? undefined },
          });
        } else if (equipeId && commande.datePrevue) {
          await prisma.planification.create({
            data: {
              commandeId,
              equipeId,
              datePlanifiee: commande.datePrevue,
              statut: "PLANIFIEE",
            },
          });
        }
      }

      return NextResponse.json({ success: true });
    }

    // Mise à jour de la planification elle-même
    const data = UpdatePlanificationSchema.parse(body);
    const { planificationId, ...updateFields } = data;
    const cleanData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updateFields)) {
      if (v !== undefined) cleanData[k] = v;
    }

    await prisma.planification.update({
      where: { id: planificationId },
      data: cleanData,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/planification PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║   DELETE /api/planification — Supprimer planification       ║
// ╚══════════════════════════════════════════════════════════════╝

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    await prisma.planification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/planification DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}