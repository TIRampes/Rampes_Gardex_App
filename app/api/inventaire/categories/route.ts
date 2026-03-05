import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CategorieFormSchema } from '@/app/api/inventaire/PieceSchema'

// GET /api/inventaire/categories
export async function GET(_request: NextRequest) {
  try {
    const data = await prisma.categoriePiece.findMany({
      include: { _count: { select: { produits: true } } },
      orderBy: { nom: 'asc' },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/inventaire/categories erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST /api/inventaire/categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CategorieFormSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const categorie = await prisma.categoriePiece.create({
      data: parsed.data,
      include: { _count: { select: { produits: true } } },
    })

    return NextResponse.json(categorie, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cette catégorie existe déjà' },
        { status: 409 }
      )
    }

    console.error('POST /api/inventaire/categories erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}