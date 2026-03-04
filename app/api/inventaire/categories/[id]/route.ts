import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CategorieFormSchema } from '@/app/api/inventaire/PieceSchema';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/inventaire/categories/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = CategorieFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const categorie = await prisma.categoriePiece.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { produits: true } } },
    });

    return NextResponse.json(categorie);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 409 });
    }
    console.error('PUT /api/inventaire/categories/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/inventaire/categories/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const categorie = await prisma.categoriePiece.findUnique({
      where: { id },
      include: { _count: { select: { produits: true } } },
    });

    if (!categorie) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    if (categorie._count.produits > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer : ${categorie._count.produits} pièce(s) utilisent cette catégorie` },
        { status: 409 }
      );
    }

    await prisma.categoriePiece.delete({ where: { id } });
    return NextResponse.json({ message: 'Catégorie supprimée' });
  } catch (error) {
    console.error('DELETE /api/inventaire/categories/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}