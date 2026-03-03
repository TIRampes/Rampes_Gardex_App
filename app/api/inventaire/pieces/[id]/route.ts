import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PIECE_INCLUDE = {
  categoriePiece: { select: { id: true, nom: true } },
  unite: { select: { id: true, unite: true, qtePar: true } },
  fournisseur: { select: { id: true, nom: true } },
} as const;

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const piece = await prisma.produit.findUnique({ where: { id: params.id }, include: PIECE_INCLUDE });
    if (!piece) return NextResponse.json({ error: "Pièce non trouvée" }, { status: 404 });
    return NextResponse.json({
      data: { ...piece, prixUnitaire: piece.prixUnitaire ? Number(piece.prixUnitaire) : null, createdAt: piece.createdAt.toISOString(), updatedAt: piece.updatedAt.toISOString(), dateDerniereTransaction: piece.dateDerniereTransaction?.toISOString() ?? null },
    });
  } catch (error) {
    console.error("[API/inventaire/pieces/[id] GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const existing = await prisma.produit.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Pièce non trouvée" }, { status: 404 });

    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.produit.findUnique({ where: { code: body.code } });
      if (duplicate) return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
    }

    const piece = await prisma.produit.update({
      where: { id: params.id },
      data: {
        ...(body.code !== undefined && { code: body.code }),
        ...(body.nom !== undefined && { nom: body.nom }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.categoriePieceId !== undefined && { categoriePieceId: body.categoriePieceId || null }),
        ...(body.uniteId !== undefined && { uniteId: body.uniteId || null }),
        ...(body.quantite !== undefined && { quantite: body.quantite }),
        ...(body.seuilMin !== undefined && { seuilMin: body.seuilMin }),
        ...(body.seuilMax !== undefined && { seuilMax: body.seuilMax ?? null }),
        ...(body.prixUnitaire !== undefined && { prixUnitaire: body.prixUnitaire ?? null }),
        ...(body.emplacement !== undefined && { emplacement: body.emplacement || null }),
        ...(body.emplacement2 !== undefined && { emplacement2: body.emplacement2 || null }),
        ...(body.inventaireEmplacement1 !== undefined && { inventaireEmplacement1: body.inventaireEmplacement1 }),
        ...(body.inventaireEmplacement2 !== undefined && { inventaireEmplacement2: body.inventaireEmplacement2 }),
        ...(body.couleur !== undefined && { couleur: body.couleur || null }),
        ...(body.codePieceNonPeinte !== undefined && { codePieceNonPeinte: body.codePieceNonPeinte || null }),
        ...(body.piecePeinte !== undefined && { piecePeinte: body.piecePeinte }),
        ...(body.fournisseurId !== undefined && { fournisseurId: body.fournisseurId || null }),
        ...(body.actif !== undefined && { actif: body.actif }),
      },
      include: PIECE_INCLUDE,
    });

    return NextResponse.json({
      data: { ...piece, prixUnitaire: piece.prixUnitaire ? Number(piece.prixUnitaire) : null, createdAt: piece.createdAt.toISOString(), updatedAt: piece.updatedAt.toISOString(), dateDerniereTransaction: piece.dateDerniereTransaction?.toISOString() ?? null },
    });
  } catch (error) {
    console.error("[API/inventaire/pieces/[id] PUT]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.produit.findUnique({ where: { id: params.id }, include: { mouvements: { take: 1 }, lignesAchat: { take: 1 } } });
    if (!existing) return NextResponse.json({ error: "Pièce non trouvée" }, { status: 404 });
    if (existing.mouvements.length > 0 || existing.lignesAchat.length > 0) {
      await prisma.produit.update({ where: { id: params.id }, data: { actif: false } });
      return NextResponse.json({ data: { id: params.id, action: "desactivee" } });
    }
    await prisma.produit.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id, action: "supprimee" } });
  } catch (error) {
    console.error("[API/inventaire/pieces/[id] DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}