import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PieceFormSchema } from '@/app/api/inventaire/PieceSchema'

// ✅ Types simplifiés pour Next 16
type RouteParams = { params: { id: string } }

// GET /api/inventaire/pieces/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const piece = await prisma.produit.findUnique({
      where: { id },
      include: {
        categoriePiece: true,
        unite: true,
        fournisseur: { select: { id: true, nom: true } },
      },
    })

    if (!piece) {
      return NextResponse.json({ error: 'Pièce non trouvée' }, { status: 404 })
    }

    const serialized = JSON.parse(
      JSON.stringify(piece, (key, value) =>
        typeof value === 'object' && value !== null && 'toNumber' in value
          ? value.toNumber()
          : value
      )
    )

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('GET /api/inventaire/pieces/[id] erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/inventaire/pieces/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const parsed = PieceFormSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { categoriePieceId, uniteId, fournisseurId, ...rest } = parsed.data

    // Vérifier code unique si changé
    if (rest.code) {
      const existing = await prisma.produit.findFirst({
        where: { code: rest.code, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Ce code existe déjà' }, { status: 409 })
      }
    }

    const updateData: any = { ...rest }
    if (categoriePieceId !== undefined) updateData.categoriePieceId = categoriePieceId || null
    if (uniteId !== undefined) updateData.uniteId = uniteId || null
    if (fournisseurId !== undefined) updateData.fournisseurId = fournisseurId || null
    if (rest.prixUnitaire !== undefined) updateData.prixUnitaire = rest.prixUnitaire ?? null
    if (rest.seuilMax !== undefined) updateData.seuilMax = rest.seuilMax ?? null

    const piece = await prisma.produit.update({
      where: { id },
      data: updateData,
      include: {
        categoriePiece: true,
        unite: true,
        fournisseur: { select: { id: true, nom: true } },
      },
    })

    const serialized = JSON.parse(
      JSON.stringify(piece, (key, value) =>
        typeof value === 'object' && value !== null && 'toNumber' in value
          ? value.toNumber()
          : value
      )
    )

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('PUT /api/inventaire/pieces/[id] erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/inventaire/pieces/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const piece = await prisma.produit.findUnique({
      where: { id },
      include: { _count: { select: { mouvements: true, lignesAchat: true } } },
    })

    if (!piece) {
      return NextResponse.json({ error: 'Pièce non trouvée' }, { status: 404 })
    }

    // Désactiver si relations existantes, sinon supprimer
    if (piece._count.mouvements > 0 || piece._count.lignesAchat > 0) {
      await prisma.produit.update({ where: { id }, data: { actif: false } })
      return NextResponse.json({ message: 'Pièce désactivée (relations existantes)', desactivee: true })
    }

    await prisma.produit.delete({ where: { id } })
    return NextResponse.json({ message: 'Pièce supprimée' })
  } catch (error) {
    console.error('DELETE /api/inventaire/pieces/[id] erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}