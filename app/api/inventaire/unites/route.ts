import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UniteFormSchema } from '@/app/api/inventaire/PieceSchema';

// GET /api/inventaire/unites
export async function GET() {
  try {
    const data = await prisma.unite.findMany({
      include: { _count: { select: { produits: true } } },
      orderBy: { unite: 'asc' },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/inventaire/unites erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/inventaire/unites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = UniteFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const unite = await prisma.unite.create({
      data: parsed.data,
      include: { _count: { select: { produits: true } } },
    });

    return NextResponse.json(unite, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Cette unité existe déjà' }, { status: 409 });
    }
    console.error('POST /api/inventaire/unites erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}