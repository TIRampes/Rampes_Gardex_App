import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ╔═══════════════════════════════════════════╗
// ║  GET /api/inventaire/pieces               ║
// ║  POST /api/inventaire/pieces              ║
// ╚═══════════════════════════════════════════╝

const PIECE_INCLUDE = {
  categoriePiece: { select: { id: true, nom: true } },
  unite: { select: { id: true, unite: true, qtePar: true } },
  fournisseur: { select: { id: true, nom: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get("recherche") ?? "";
    const categorieId = searchParams.get("categorieId") ?? "";
    const fournisseurId = searchParams.get("fournisseurId") ?? "";
    const actif = searchParams.get("actif");
    const sousSeuilMin = searchParams.get("sousSeuilMin") === "true";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limite = parseInt(searchParams.get("limite") ?? "50");

    const where: Record<string, unknown> = {};

    if (actif !== null && actif !== "") {
      where.actif = actif === "true";
    }
    if (categorieId) where.categoriePieceId = categorieId;
    if (fournisseurId) where.fournisseurId = fournisseurId;

    if (recherche) {
      where.OR = [
        { code: { contains: recherche } },
        { nom: { contains: recherche } },
        { description: { contains: recherche } },
        { emplacement: { contains: recherche } },
        { couleur: { contains: recherche } },
      ];
    }

    if (sousSeuilMin) {
      where.AND = [
        { seuilMin: { gt: 0 } },
        { quantite: { lte: prisma.produit.fields.seuilMin } },
      ];
      // Alternative: raw where for MySQL
      delete where.AND;
      where.quantite = { lte: 0 }; // Will be overridden below
    }

    const skip = (page - 1) * limite;

    let pieces, total;

    if (sousSeuilMin) {
      // Requête spéciale: quantité <= seuilMin
      const allPieces = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM produits WHERE quantite <= seuilMin AND seuilMin > 0 AND actif = true
      `;
      const ids = allPieces.map((p) => p.id);
      where.id = { in: ids };
      delete where.quantite;

      [pieces, total] = await Promise.all([
        prisma.produit.findMany({ where: { id: { in: ids } }, include: PIECE_INCLUDE, orderBy: [{ quantite: "asc" }], skip, take: limite }),
        ids.length,
      ]);
    } else {
      [pieces, total] = await Promise.all([
        prisma.produit.findMany({ where, include: PIECE_INCLUDE, orderBy: [{ code: "asc" }], skip, take: limite }),
        prisma.produit.count({ where }),
      ]);
    }

    // Stats rapides
    const [totalActives, totalInactives, totalSousSeuilRaw, valeurRaw] = await Promise.all([
      prisma.produit.count({ where: { actif: true } }),
      prisma.produit.count({ where: { actif: false } }),
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM produits WHERE quantite <= seuilMin AND seuilMin > 0 AND actif = true`,
      prisma.$queryRaw<[{ total: number }]>`SELECT COALESCE(SUM(quantite * prixUnitaire), 0) as total FROM produits WHERE actif = true AND prixUnitaire IS NOT NULL`,
    ]);

    const data = pieces.map((p) => ({
      ...p,
      prixUnitaire: p.prixUnitaire ? Number(p.prixUnitaire) : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      dateDerniereTransaction: p.dateDerniereTransaction?.toISOString() ?? null,
    }));

    return NextResponse.json({
      data,
      pagination: { page, limite, total, totalPages: Math.ceil(total / limite) },
      stats: {
        totalActives,
        totalInactives,
        totalSousSeuil: Number(totalSousSeuilRaw[0]?.count ?? 0),
        valeurStock: Number(valeurRaw[0]?.total ?? 0),
      },
    });
  } catch (error) {
    console.error("[API/inventaire/pieces GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, nom, description, categoriePieceId, uniteId, quantite, seuilMin, seuilMax, prixUnitaire, emplacement, emplacement2, inventaireEmplacement1, inventaireEmplacement2, couleur, codePieceNonPeinte, piecePeinte, fournisseurId, actif } = body;

    if (!code || !nom) {
      return NextResponse.json({ error: "Code et nom sont requis" }, { status: 400 });
    }

    const existing = await prisma.produit.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
    }

    const piece = await prisma.produit.create({
      data: {
        code,
        nom,
        description: description || null,
        categoriePieceId: categoriePieceId || null,
        uniteId: uniteId || null,
        quantite: quantite ?? 0,
        seuilMin: seuilMin ?? 0,
        seuilMax: seuilMax ?? null,
        prixUnitaire: prixUnitaire ?? null,
        emplacement: emplacement || null,
        emplacement2: emplacement2 || null,
        inventaireEmplacement1: inventaireEmplacement1 ?? 0,
        inventaireEmplacement2: inventaireEmplacement2 ?? 0,
        couleur: couleur || null,
        codePieceNonPeinte: codePieceNonPeinte || null,
        piecePeinte: piecePeinte ?? false,
        fournisseurId: fournisseurId || null,
        actif: actif ?? true,
      },
      include: PIECE_INCLUDE,
    });

    return NextResponse.json({ data: { ...piece, prixUnitaire: piece.prixUnitaire ? Number(piece.prixUnitaire) : null, createdAt: piece.createdAt.toISOString(), updatedAt: piece.updatedAt.toISOString(), dateDerniereTransaction: null } }, { status: 201 });
  } catch (error) {
    console.error("[API/inventaire/pieces POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}