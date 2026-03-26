import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FournisseurUpdateSchema } from '@/app/api/achats/schema';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const nom = formData.get('nom') as string | null;
    const contact = formData.get('contact') as string | null;
    const telephone = formData.get('telephone') as string | null;
    const email = formData.get('email') as string | null;
    const adresse = formData.get('adresse') as string | null;
    const notes = formData.get('notes') as string | null;
    const typeAchat = formData.get('typeAchat') as string | null;
    const file = formData.get('formulaire') as File | null;
    const supprimerFormulaire = formData.get('supprimerFormulaire') === 'true';

    const parsed = FournisseurUpdateSchema.safeParse({
      nom,
      contact,
      telephone,
      email,
      adresse,
      notes,
      typeAchat: typeAchat || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.fournisseur.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Fournisseur non trouvé' }, { status: 404 });

    const updateData: any = {};
    if (parsed.data.nom !== undefined) updateData.nom = parsed.data.nom;
    if (parsed.data.contact !== undefined) updateData.contact = parsed.data.contact || null;
    if (parsed.data.telephone !== undefined) updateData.telephone = parsed.data.telephone || null;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null;
    if (parsed.data.adresse !== undefined) updateData.adresse = parsed.data.adresse || null;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null;
    if (parsed.data.typeAchat !== undefined) updateData.typeAchat = parsed.data.typeAchat || null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      updateData.formulaireNom = file.name;
      updateData.formulaireMime = file.type;
      updateData.formulaireData = buffer;
    } else if (supprimerFormulaire) {
      updateData.formulaireNom = null;
      updateData.formulaireMime = null;
      updateData.formulaireData = null;
    }

    const fournisseur = await prisma.fournisseur.update({ where: { id }, data: updateData });
    return NextResponse.json(fournisseur);
  } catch (error) {
    console.error('PUT /api/achats/fournisseurs/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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