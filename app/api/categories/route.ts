import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.categoriePiece.findMany({
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    )
  }
}