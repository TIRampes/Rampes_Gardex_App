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

    const { nom } = await request.json();
    if (!nom || typeof nom !== 'string' || nom.trim() === '') {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    const dept = await prisma.departementNC.update({
      where: { id },
      data: { nom: nom.trim() },
    });

    return NextResponse.json(dept);
  } catch (error) {
    console.error('Erreur PUT /departements:', error);
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

    await prisma.departementNC.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erreur DELETE /departements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}