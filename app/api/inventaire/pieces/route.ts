import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PieceFormSchema } from '@/app/api/inventaire/PieceSchema';

// GET /api/inventaire/pieces
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get('recherche') || '';
    const categorieId = searchParams.get('categorieId') || '';
    const fournisseurId = searchParams.get('fournisseurId') || '';
    const sousSeuilMin = searchParams.get('sousSeuilMin') === 'true';
    const actif = searchParams.get('actif');
    const page = parseInt(searchParams.get('page') || '1');
    const limite = parseInt(searchParams.get('limite') || '100');
    const tous = searchParams.get('tous') === 'true'; // Pour les selects

    const where: any = {};

    if (recherche) {
      where.OR = [
        { code: { contains: recherche } },
        { nom: { contains: recherche } },
        { description: { contains: recherche } },
      ];
    }
    if (categorieId) where.categoriePieceId = categorieId;
    if (fournisseurId) where.fournisseurId = fournisseurId;
    if (actif !== null && actif !== '') where.actif = actif === 'true';
    if (sousSeuilMin) {
      where.seuilMin = { gt: 0 };
      where.quantite = { lte: prisma.produit.fields.seuilMin };
    }

    // Pour les sousSeuilMin, on doit utiliser une requête brute
    let data;
    let total;

    if (sousSeuilMin) {
      // Requête spéciale pour sous seuil min
      const whereBase: any = {};
      if (recherche) {
        whereBase.OR = [
          { code: { contains: recherche } },
          { nom: { contains: recherche } },
        ];
      }
      if (categorieId) whereBase.categoriePieceId = categorieId;
      if (fournisseurId) whereBase.fournisseurId = fournisseurId;
      if (actif !== null && actif !== '') whereBase.actif = actif === 'true';

      const allPieces = await prisma.produit.findMany({
        where: whereBase,
        include: {
          categoriePiece: true,
          unite: true,
          fournisseur: { select: { id: true, nom: true } },
        },
        orderBy: { code: 'asc' },
      });

      const filtered = allPieces.filter(
        (p) => p.seuilMin > 0 && p.quantite <= p.seuilMin
      );
      total = filtered.length;

      if (tous) {
        data = filtered;
      } else {
        data = filtered.slice((page - 1) * limite, page * limite);
      }
    } else {
      const whereClean = { ...where };
      delete whereClean.quantite;
      delete whereClean.seuilMin;

      total = await prisma.produit.count({ where: whereClean });

      if (tous) {
        data = await prisma.produit.findMany({
          where: whereClean,
          include: {
            categoriePiece: true,
            unite: true,
            fournisseur: { select: { id: true, nom: true } },
          },
          orderBy: { code: 'asc' },
        });
      } else {
        data = await prisma.produit.findMany({
          where: whereClean,
          include: {
            categoriePiece: true,
            unite: true,
            fournisseur: { select: { id: true, nom: true } },
          },
          orderBy: { code: 'asc' },
          skip: (page - 1) * limite,
          take: limite,
        });
      }
    }

    // Stats
    const totalPieces = await prisma.produit.count();
    const piecesActives = await prisma.produit.count({ where: { actif: true } });
    const allForStats = await prisma.produit.findMany({
      where: { actif: true },
      select: { quantite: true, seuilMin: true, prixUnitaire: true },
    });
    const piecesSousSeuilMin = allForStats.filter(
      (p) => p.seuilMin > 0 && p.quantite <= p.seuilMin
    ).length;
    const valeurStock = allForStats.reduce(
      (acc, p) => acc + p.quantite * (Number(p.prixUnitaire) || 0),
      0
    );

    // Convertir les Decimal en Number
    const serialized = JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === 'object' && value !== null && 'toNumber' in value
          ? value.toNumber()
          : value
      )
    );

    return NextResponse.json({
      data: serialized,
      pagination: {
        page,
        limite,
        total,
        totalPages: Math.ceil(total / limite),
      },
      stats: {
        totalPieces,
        piecesActives,
        piecesSousSeuilMin,
        valeurStock,
      },
    });
  } catch (error) {
    console.error('GET /api/inventaire/pieces erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/inventaire/pieces
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PieceFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { categoriePieceId, uniteId, fournisseurId, ...rest } = parsed.data;

    // Vérifier code unique
    const existing = await prisma.produit.findUnique({ where: { code: rest.code } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ce code existe déjà' },
        { status: 409 }
      );
    }

    const piece = await prisma.produit.create({
      data: {
        ...rest,
        prixUnitaire: rest.prixUnitaire ?? null,
        seuilMax: rest.seuilMax ?? null,
        categoriePieceId: categoriePieceId || null,
        uniteId: uniteId || null,
        fournisseurId: fournisseurId || null,
      },
      include: {
        categoriePiece: true,
        unite: true,
        fournisseur: { select: { id: true, nom: true } },
      },
    });

    const serialized = JSON.parse(
      JSON.stringify(piece, (key, value) =>
        typeof value === 'object' && value !== null && 'toNumber' in value
          ? value.toNumber()
          : value
      )
    );

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error('POST /api/inventaire/pieces erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}