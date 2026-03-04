import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const produit = await prisma.produit.findUnique({
      where: { id: params.id },
      include: {
        categoriePiece: true,
        unite: true,
        fournisseur: true,
      },
    })

    if (!produit) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(produit)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const produit = await prisma.produit.update({
      where: { id: params.id },
      data: {
        code: body.code,
        nom: body.nom,
        description: body.description,
        categoriePieceId: body.categoriePieceId,
        couleur: body.couleur,
        uniteId: body.uniteId,
        fournisseurId: body.fournisseurId,
        quantite: body.quantite,
        seuilMin: body.seuilMin,
        prixUnitaire: body.prixUnitaire,
        emplacement: body.emplacement,
        codePieceNonPeinte: body.codePieceNonPeinte,
        piecePeinte: body.piecePeinte,
        achatFait: body.achatFait,
        partiPeinture: body.partiPeinture,
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
      { error: 'Erreur lors de la mise à jour du produit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.produit.update({
      where: { id: params.id },
      data: { actif: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du produit' },
      { status: 500 }
    )
  }
}