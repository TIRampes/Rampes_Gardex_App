import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FournisseurFormSchema } from '@/app/api/inventaire/PieceSchema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get('recherche') || '';
    const actif = searchParams.get('actif');

    const where: any = {};
    if (recherche) {
      where.OR = [
        { nom: { contains: recherche } },
        { contact: { contains: recherche } },
        { email: { contains: recherche } },
      ];
    }
    if (actif !== null && actif !== '') {
      where.actif = actif === 'true';
    }

    const data = await prisma.fournisseur.findMany({
      where,
      select: {
        id: true,
        nom: true,
        contact: true,
        telephone: true,
        email: true,
        adresse: true,
        notes: true,
        typeAchat: true,
        formulaireNom: true,
        formulaireMime: true,
        actif: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { produitsPrincipaux: true, produits: true, achats: true } },
      },
      orderBy: { nom: 'asc' },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/inventaire/fournisseurs erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const nom = formData.get('nom') as string;
    const contact = formData.get('contact') as string | null;
    const telephone = formData.get('telephone') as string | null;
    const email = formData.get('email') as string | null;
    const adresse = formData.get('adresse') as string | null;
    const notes = formData.get('notes') as string | null;
    const typeAchat = formData.get('typeAchat') as string | null;
    const file = formData.get('formulaire') as File | null;

    // Validation
    const parsed = FournisseurFormSchema.safeParse({
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

    const data: any = {
      nom: parsed.data.nom,
      contact: parsed.data.contact || null,
      telephone: parsed.data.telephone || null,
      email: parsed.data.email || null,
      adresse: parsed.data.adresse || null,
      notes: parsed.data.notes || null,
      typeAchat: parsed.data.typeAchat || null,
      actif: true,
    };

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      data.formulaireNom = file.name;
      data.formulaireMime = file.type;
      data.formulaireData = buffer;
    }

    const fournisseur = await prisma.fournisseur.create({ data });
    return NextResponse.json(fournisseur, { status: 201 });
  } catch (error) {
    console.error('POST /api/inventaire/fournisseurs erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}