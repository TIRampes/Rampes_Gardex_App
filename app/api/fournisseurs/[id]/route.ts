import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const fournisseur = await prisma.fournisseur.update({
      where: { id: params.id },
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
      { error: 'Erreur lors de la mise à jour du fournisseur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.fournisseur.update({
      where: { id: params.id },
      data: { actif: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du fournisseur' },
      { status: 500 }
    )
  }
}