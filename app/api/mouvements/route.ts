import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const produitId = searchParams.get('produitId')
  const debut = searchParams.get('debut')
  const fin = searchParams.get('fin')

  try {
    const where: any = {}
    if (produitId) where.produitId = produitId
    if (debut || fin) {
      where.createdAt = {}
      if (debut) where.createdAt.gte = new Date(debut)
      if (fin) where.createdAt.lte = new Date(fin)
    }

    const mouvements = await prisma.mouvementStock.findMany({
      where,
      include: {
        produit: true,
        commande: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(mouvements)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des mouvements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Récupérer le produit pour connaître la quantité avant
    const produit = await prisma.produit.findUnique({
      where: { id: body.produitId },
    })
    if (!produit) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const quantiteAvant = produit.quantite
    let quantiteApres = quantiteAvant

    // Calcul de la nouvelle quantité selon le type
    switch (body.type) {
      case 'ENTREE':
        quantiteApres = quantiteAvant + body.quantite
        break
      case 'SORTIE':
        quantiteApres = quantiteAvant - body.quantite
        break
      case 'AJUSTEMENT':
        quantiteApres = body.quantite
        break
      default:
        quantiteApres = quantiteAvant
    }

    // Créer le mouvement
    const mouvement = await prisma.mouvementStock.create({
      data: {
        produitId: body.produitId,
        commandeId: body.commandeId,
        type: body.type,
        quantite: body.quantite,
        quantiteAvant,
        quantiteApres,
        reference: body.reference,
        notes: body.notes,
        noTransaction: body.noTransaction,
        receptionTransaction: body.receptionTransaction,
        codePiecePeinte: body.codePiecePeinte,
        dateReceptionPeinture: body.dateReceptionPeinture,
        noOrdrePeinture: body.noOrdrePeinture,
        heureTransaction: body.heureTransaction,
        emplacement: body.emplacement,
      },
    })

    // Mettre à jour la quantité du produit
    await prisma.produit.update({
      where: { id: body.produitId },
      data: {
        quantite: quantiteApres,
        dateDerniereTransaction: new Date(),
      },
    })

    return NextResponse.json(mouvement)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du mouvement' },
      { status: 500 }
    )
  }
}