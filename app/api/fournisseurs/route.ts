import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search') || ''

  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      where: {
        actif: true,
        ...(search && {
          OR: [
            { nom: { contains: search } },
            { contact: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      },
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json(fournisseurs)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fournisseurs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fournisseur = await prisma.fournisseur.create({
      data: {
        nom: body.nom,
        contact: body.contact,
        telephone: body.telephone,
        email: body.email,
        adresse: body.adresse,
        notes: body.notes,
      },
    })
    return NextResponse.json(fournisseur)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du fournisseur' },
      { status: 500 }
    )
  }
}