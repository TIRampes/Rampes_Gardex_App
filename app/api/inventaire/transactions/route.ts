import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionFormSchema } from '@/app/api/inventaire/PieceSchema';

// GET /api/inventaire/transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get('recherche') || '';
    const dateDebut = searchParams.get('dateDebut') || '';
    const produitId = searchParams.get('produitId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limite = parseInt(searchParams.get('limite') || '50');

    const where: any = {};

    if (recherche) {
      where.produit = {
        OR: [
          { code: { contains: recherche } },
          { nom: { contains: recherche } },
        ],
      };
    }
    if (produitId) where.produitId = produitId;
    if (dateDebut) where.createdAt = { gte: new Date(dateDebut) };

    const total = await prisma.mouvementStock.count({ where });

    const data = await prisma.mouvementStock.findMany({
      where,
      include: {
        produit: { select: { id: true, code: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limite,
      take: limite,
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limite,
        total,
        totalPages: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error('GET /api/inventaire/transactions erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/inventaire/transactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = TransactionFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { produitId, type, quantite, notes, emplacement } = parsed.data;

    // Récupérer la pièce actuelle
    const piece = await prisma.produit.findUnique({ where: { id: produitId } });
    if (!piece) {
      return NextResponse.json({ error: 'Pièce non trouvée' }, { status: 404 });
    }

    const quantiteAvant = piece.quantite;
    let quantiteApres = quantiteAvant;

    // Calculer la nouvelle quantité selon le type
    switch (type) {
      case 'ENTREE':
        quantiteApres = quantiteAvant + quantite;
        break;
      case 'SORTIE':
      case 'SORTIE_PEINTURE':
        quantiteApres = Math.max(0, quantiteAvant - quantite);
        break;
      case 'AJUSTEMENT':
        quantiteApres = quantite; // Mise à jour directe
        break;
    }

    // Transaction atomique : créer mouvement + mettre à jour stock
    const [mouvement] = await prisma.$transaction([
      prisma.mouvementStock.create({
        data: {
          produitId,
          type,
          quantite,
          quantiteAvant,
          quantiteApres,
          notes: notes || null,
          emplacement: emplacement || null,
        },
        include: {
          produit: { select: { id: true, code: true, nom: true } },
        },
      }),
      prisma.produit.update({
        where: { id: produitId },
        data: {
          quantite: quantiteApres,
          dateDerniereTransaction: new Date(),
          ...(type === 'SORTIE_PEINTURE' ? { partiPeinture: piece.partiPeinture + quantite } : {}),
        },
      }),
    ]);

    return NextResponse.json(mouvement, { status: 201 });
  } catch (error) {
    console.error('POST /api/inventaire/transactions erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}