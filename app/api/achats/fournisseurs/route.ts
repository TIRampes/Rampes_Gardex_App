import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FournisseurCreateSchema } from '@/app/api/achats/schema';

export async function GET() {
  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
      select: {
        id: true,
        nom: true,
        contact: true,
        telephone: true,
        email: true,
        adresse: true,
        notes: true,
        actif: true,
        typeAchat: true,
        formulaireNom: true,
        formulaireMime: true,
        _count: { select: { achats: true } },
      },
    });
    return NextResponse.json({ fournisseurs });
  } catch (error) {
    console.error('GET /api/achats/fournisseurs erreur:', error);
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
    const parsed = FournisseurCreateSchema.safeParse({
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
    console.error('POST /api/achats/fournisseurs erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}