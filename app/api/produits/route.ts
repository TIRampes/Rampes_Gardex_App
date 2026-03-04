import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search') || ''
  const categorieId = searchParams.get('categorieId')
  const fournisseurId = searchParams.get('fournisseurId')
  const pointCommande = searchParams.get('pointCommande') === 'true'

  try {
    const where: Prisma.ProduitWhereInput = {
      actif: true,
      ...(search && {
        OR: [
          { code: { contains: search } },
          { nom: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(categorieId && { categoriePieceId: categorieId }),
      ...(fournisseurId && { fournisseurId: fournisseurId }),
      ...(pointCommande && {
        quantite: { lte: prisma.produit.fields.seuilMin },
        seuilMin: { gt: 0 },
      }),
    }

    const produits = await prisma.produit.findMany({
      where,
      include: {
        categoriePiece: true,
        unite: true,
        fournisseur: true,
      },
      orderBy: { code: 'asc' },
    })
    

    return NextResponse.json(produits)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const produit = await prisma.produit.create({
      data: {
        code: body.code,
        nom: body.nom,
        description: body.description,
        categoriePieceId: body.categoriePieceId,
        couleur: body.couleur,
        uniteId: body.uniteId,
        fournisseurId: body.fournisseurId,
        quantite: body.quantite || 0,
        seuilMin: body.seuilMin || 0,
        prixUnitaire: body.prixUnitaire,
        emplacement: body.emplacement,
        codePieceNonPeinte: body.codePieceNonPeinte,
        piecePeinte: body.piecePeinte || false,
        achatFait: body.achatFait || false,
        partiPeinture: body.partiPeinture || 0,
      },
      include: {
        categoriePiece: true,
        unite: true,
        fournisseur: true,
      },
    })
    return NextResponse.json(produit)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du produit' },
      { status: 500 }
    )
  }
}