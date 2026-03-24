// ============================================================
// app/api/multilogements/route.ts
// GET — Liste des commandes multi-logements (COMMERCIAL, MULTI_PHASE, MULTIPLAN)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MultiLogementsQuerySchema } from "@/app/api/multilogements/schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validation des query params avec Zod
    const parsed = MultiLogementsQuerySchema.safeParse({
      type: searchParams.get("type") ?? "tous",
      statut: searchParams.get("statut") ?? "tous",
      recherche: searchParams.get("recherche") ?? undefined,
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 50,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, statut, recherche, page, limit } = parsed.data;

    // Construire le filtre Prisma
    const where: any = {
      typeCommande: {
        in:
          type === "tous"
            ? ["COMMERCIAL", "MULTI_PHASE", "MULTIPLAN"]
            : [type],
      },
    };

    if (statut !== "tous") {
      where.statut = statut;
    }

    if (recherche) {
      where.OR = [
        { numero: { contains: recherche } },
        { client: { nom: { contains: recherche } } },
        { adresse: { contains: recherche } },
        { reference: { contains: recherche } },
        { commentaire: { contains: recherche } },
      ];
    }

    // Récupérer les commandes avec balcons
    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where,
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
            orderBy: [{ numeroPhase: "asc" }, { nom: "asc" }],
          },
        },
        orderBy: [{ statut: "asc" }, { dateEntree: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.commande.count({ where }),
    ]);

    // Calculer les stats globales
    const allCommandes = await prisma.commande.findMany({
      where: {
        typeCommande: { in: ["COMMERCIAL", "MULTI_PHASE", "MULTIPLAN"] },
      },
      include: {
        balcons: { select: { piedsLineaires: true, installationTerminee: true } },
      },
    });

    const stats = {
      totalCommandes: allCommandes.length,
      commandesCommercial: allCommandes.filter(
        (c) => c.typeCommande === "COMMERCIAL"
      ).length,
      commandesMultiPhase: allCommandes.filter(
        (c) => c.typeCommande === "MULTI_PHASE"
      ).length,
      commandesMultiPlan: allCommandes.filter(
        (c) => c.typeCommande === "MULTIPLAN"
      ).length,
      totalBalcons: allCommandes.reduce((s, c) => s + c.balcons.length, 0),
      balconsCompletes: allCommandes.reduce(
        (s, c) =>
          s + c.balcons.filter((b) => b.installationTerminee).length,
        0
      ),
      totalPiedsLineaires: allCommandes.reduce(
        (s, c) =>
          s + c.balcons.reduce((sb, b) => sb + b.piedsLineaires, 0),
        0
      ),
    };

    return NextResponse.json({ commandes, total, stats });
  } catch (error) {
    console.error("Erreur API multilogements:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}