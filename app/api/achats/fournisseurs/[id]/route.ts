import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FournisseurUpdateSchema } from '@/app/api/achats/schema';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/achats/fournisseurs/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = FournisseurUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.fournisseur.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Fournisseur non trouvé' }, { status: 404 });

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.contact !== undefined) updateData.contact = data.contact || null;
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const fournisseur = await prisma.fournisseur.update({ where: { id }, data: updateData });
    return NextResponse.json(fournisseur);
  } catch (error) {
    console.error('PUT /api/achats/fournisseurs/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/achats/fournisseurs/[id] — désactive (soft delete) si a des achats, sinon supprime
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.fournisseur.findUnique({
      where: { id },
      include: { _count: { select: { achats: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Fournisseur non trouvé' }, { status: 404 });

    if (existing._count.achats > 0) {
      await prisma.fournisseur.update({ where: { id }, data: { actif: false } });
      return NextResponse.json({ message: 'Fournisseur désactivé (achats liés existants)' });
    }

    await prisma.fournisseur.delete({ where: { id } });
    return NextResponse.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    console.error('DELETE /api/achats/fournisseurs/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}