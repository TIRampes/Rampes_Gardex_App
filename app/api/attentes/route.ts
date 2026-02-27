import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  AttentesQuerySchema,
  CODES_ATTENTE,
} from "@/app/api/attentes/schema";
import {
  extraireChampsEnAttente,
  determinerTypeAttente,
  joursEnAttente,
} from "@/app/services/attentes.service";
import { Prisma } from "@prisma/client";

// ╔══════════════════════════════════════════════════════════════╗
// ║   GET /api/attentes — Commandes avec attente quelconque     ║
// ╚══════════════════════════════════════════════════════════════╝

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = AttentesQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    // ============================
    // Construction WHERE
    // ============================

    const attenteConditions: Prisma.CommandeWhereInput[] =
      CODES_ATTENTE.flatMap((code) => [
        { mesure: code },
        { plan: code },
        { envoyeProduction: code },
        { productionTerminee: code },
      ]);

    const where: Prisma.CommandeWhereInput = {
      statut: "ACTIVE",
      OR: attenteConditions,
    };

    if (params.representantIds) {
      const ids = params.representantIds.split(",").filter(Boolean);
      if (ids.length > 0) {
        where.representantId = { in: ids };
      }
    }

    if (params.service && params.service !== "tous") {
      where.service = params.service.toUpperCase() as any;
    }

    if (params.recherche) {
      where.AND = [
        {
          OR: [
            { numero: { contains: params.recherche } },
            { reference: { contains: params.recherche } },
            { adresse: { contains: params.recherche } },
            { commentaire: { contains: params.recherche } },
            {
              client: {
                nom: { contains: params.recherche },
              },
            },
          ],
        },
      ];
    }

    const skip = (params.page - 1) * params.limite;

    // ============================
    // Requête principale
    // ============================

    const [commandes, total, totalActives] = await Promise.all([
      prisma.commande.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              telephone: true,
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
        },
        orderBy: { dateEntree: "asc" },
        skip,
        take: params.limite,
      }),
      prisma.commande.count({ where }),
      prisma.commande.count({ where: { statut: "ACTIVE" } }),
    ]);

    // ============================
    // Transformation
    // ============================

    const data = commandes.map((cmd) => {
      const champsEnAttente = extraireChampsEnAttente(cmd);
      const typeAttente = determinerTypeAttente(champsEnAttente);
      const joursAttente = joursEnAttente(
        cmd.dateEntree.toISOString()
      );

      return {
        id: cmd.id,
        numero: cmd.numero,

        clientId: cmd.clientId,
        clientNom: cmd.client?.nom ?? "—",
        clientTelephone: cmd.client?.telephone ?? "",

        representantId: cmd.representantId,
        representantNom: cmd.representant?.nom ?? "—",
        representantEmail: cmd.representant?.email ?? "",

        reference: cmd.reference,
        adresse: cmd.adresse,
        service: cmd.service,
        typeCommande: cmd.typeCommande,

        dateEntree: cmd.dateEntree.toISOString(),
        datePrevue: cmd.datePrevue?.toISOString() ?? null,

        mesure: cmd.mesure,
        plan: cmd.plan,
        envoyeProduction: cmd.envoyeProduction,
        productionTerminee: cmd.productionTerminee,

        couleur: cmd.couleur,
        modele: null,

        champsEnAttente,
        typeAttente,

        commentaire: cmd.commentaire,

        joursEnAttente: joursAttente,
      };
    });

    // ============================
    // Filtrage post-query
    // ============================

    let filteredData = data;

    if (params.typeAttente !== "tous") {
      filteredData = data.filter(
        (d) => d.typeAttente === params.typeAttente
      );
    }

    return NextResponse.json({
      data: filteredData,
      pagination: {
        page: params.page,
        limite: params.limite,
        total,
        totalPages: Math.ceil(total / params.limite),
      },
      meta: {
        totalActives,
      },
    });
  } catch (error) {
    console.error("[API/attentes GET]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}