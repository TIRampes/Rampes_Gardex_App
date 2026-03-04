import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.unite.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Unité non trouvée" },
        { status: 404 }
      );
    }

    if (body.unite && body.unite !== existing.unite) {
      const dup = await prisma.unite.findUnique({
        where: { unite: body.unite },
      });

      if (dup) {
        return NextResponse.json(
          { error: "Cette unité existe déjà" },
          { status: 409 }
        );
      }
    }

    const unite = await prisma.unite.update({
      where: { id },
      data: {
        ...(body.unite !== undefined && { unite: body.unite }),
        ...(body.qtePar !== undefined && { qtePar: body.qtePar }),
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
      },
      include: {
        _count: { select: { produits: true } },
      },
    });

    return NextResponse.json({
      data: {
        ...unite,
        createdAt: unite.createdAt.toISOString(),
        updatedAt: unite.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API/unites/[id] PUT]", error);
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

    const existing = await prisma.unite.findUnique({
      where: { id },
      include: {
        _count: { select: { produits: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Unité non trouvée" },
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

    await prisma.unite.delete({
      where: { id },
    });

    return NextResponse.json({
      data: { id, action: "supprimee" },
    });
  } catch (error) {
    console.error("[API/unites/[id] DELETE]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}