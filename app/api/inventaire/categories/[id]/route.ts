import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.categoriePiece.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }

    if (body.nom && body.nom !== existing.nom) {
      const dup = await prisma.categoriePiece.findUnique({
        where: { nom: body.nom },
      });

      if (dup) {
        return NextResponse.json(
          { error: "Cette catégorie existe déjà" },
          { status: 409 }
        );
      }
    }

    const categorie = await prisma.categoriePiece.update({
      where: { id },
      data: {
        ...(body.nom !== undefined && { nom: body.nom }),
      },
      include: {
        _count: { select: { produits: true } },
      },
    });

    return NextResponse.json({
      data: {
        ...categorie,
        createdAt: categorie.createdAt.toISOString(),
        updatedAt: categorie.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API/categories/[id] PUT]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.categoriePiece.findUnique({
      where: { id },
      include: {
        _count: { select: { produits: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }

    if (existing._count.produits > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer: ${existing._count.produits} pièce(s) liée(s)`,
        },
        { status: 400 }
      );
    }

    await prisma.categoriePiece.delete({
      where: { id },
    });

    return NextResponse.json({
      data: { id, action: "supprimee" },
    });
  } catch (error) {
    console.error("[API/categories/[id] DELETE]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}