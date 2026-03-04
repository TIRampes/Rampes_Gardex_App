import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const unites = await prisma.unite.findMany({
      orderBy: { unite: 'asc' },
    })
    return NextResponse.json(unites)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des unités' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const unite = await prisma.unite.create({
      data: {
        unite: body.unite,
        qtePar: body.qtePar || 1,
        description: body.description,
      },
    })
    return NextResponse.json(unite)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'unité' },
      { status: 500 }
    )
  }
}