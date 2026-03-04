import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FournisseurFormSchema } from '@/app/api/inventaire/PieceSchema';

// GET /api/inventaire/fournisseurs
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
    if (actif !== null && actif !== '') where.actif = actif === 'true';

    const data = await prisma.fournisseur.findMany({
      where,
      include: {
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

// POST /api/inventaire/fournisseurs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = FournisseurFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const fournisseur = await prisma.fournisseur.create({
      data: parsed.data,
      include: {
        _count: { select: { produitsPrincipaux: true, produits: true, achats: true } },
      },
    });

    return NextResponse.json(fournisseur, { status: 201 });
  } catch (error) {
    console.error('POST /api/inventaire/fournisseurs erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}