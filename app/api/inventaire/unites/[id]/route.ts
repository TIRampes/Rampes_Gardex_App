import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UniteFormSchema } from '@/app/api/inventaire/PieceSchema';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/inventaire/unites/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UniteFormSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const unite = await prisma.unite.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { produits: true } } },
    });

    return NextResponse.json(unite);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Cette unité existe déjà' }, { status: 409 });
    }
    console.error('PUT /api/inventaire/unites/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/inventaire/unites/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const unite = await prisma.unite.findUnique({
      where: { id },
      include: { _count: { select: { produits: true } } },
    });

    if (!unite) {
      return NextResponse.json({ error: 'Unité non trouvée' }, { status: 404 });
    }

    if (unite._count.produits > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer : ${unite._count.produits} pièce(s) utilisent cette unité` },
        { status: 409 }
      );
    }

    await prisma.unite.delete({ where: { id } });
    return NextResponse.json({ message: 'Unité supprimée' });
  } catch (error) {
    console.error('DELETE /api/inventaire/unites/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}