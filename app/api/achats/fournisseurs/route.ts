import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FournisseurCreateSchema } from '@/app/api/achats/schema';

// GET /api/achats/fournisseurs
export async function GET() {
  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
      select: {
        id: true, nom: true, contact: true, telephone: true,
        email: true, adresse: true, notes: true, actif: true,
        _count: { select: { achats: true } },
      },
    });

    return NextResponse.json({ fournisseurs });
  } catch (error) {
    console.error('GET /api/achats/fournisseurs erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/achats/fournisseurs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = FournisseurCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const fournisseur = await prisma.fournisseur.create({
      data: {
        nom: data.nom,
        contact: data.contact || null,
        telephone: data.telephone || null,
        email: data.email || null,
        adresse: data.adresse || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(fournisseur, { status: 201 });
  } catch (error) {
    console.error('POST /api/achats/fournisseurs erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}