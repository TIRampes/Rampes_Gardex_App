import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FournisseurFormSchema } from '@/app/api/inventaire/PieceSchema';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/inventaire/fournisseurs/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id },
      include: {
        _count: { select: { produitsPrincipaux: true, produits: true, achats: true } },
      },
    });

    if (!fournisseur) {
      return NextResponse.json({ error: 'Fournisseur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(fournisseur);
  } catch (error) {
    console.error('GET /api/inventaire/fournisseurs/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/inventaire/fournisseurs/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = FournisseurFormSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const fournisseur = await prisma.fournisseur.update({
      where: { id },
      data: parsed.data,
      include: {
        _count: { select: { produitsPrincipaux: true, produits: true, achats: true } },
      },
    });

    return NextResponse.json(fournisseur);
  } catch (error) {
    console.error('PUT /api/inventaire/fournisseurs/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/inventaire/fournisseurs/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id },
      include: {
        _count: { select: { produitsPrincipaux: true, achats: true } },
      },
    });

    if (!fournisseur) {
      return NextResponse.json({ error: 'Fournisseur non trouvé' }, { status: 404 });
    }

    if (fournisseur._count.produitsPrincipaux > 0 || fournisseur._count.achats > 0) {
      await prisma.fournisseur.update({
        where: { id },
        data: { actif: false },
      });
      return NextResponse.json({ message: 'Fournisseur désactivé (relations existantes)', desactivee: true });
    }

    await prisma.fournisseur.delete({ where: { id } });
    return NextResponse.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    console.error('DELETE /api/inventaire/fournisseurs/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}