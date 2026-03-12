'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const { nom, departementId } = await request.json();
    if (!nom || !departementId) {
      return NextResponse.json({ error: 'Nom et département requis' }, { status: 400 });
    }

    const type = await prisma.typeNC.update({
      where: { id },
      data: { nom: nom.trim(), departementId },
      include: { departement: true },
    });

    return NextResponse.json(type);
  } catch (error) {
    console.error('Erreur PUT /types:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    await prisma.typeNC.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erreur DELETE /types:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}