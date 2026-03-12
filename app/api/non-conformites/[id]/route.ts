'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const nc = await prisma.nonConformite.findUnique({
      where: { id },
      include: {
        departement: true,
        type: true,
        responsable: true,
        commande: true,
      },
    });

    if (!nc) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });

    return NextResponse.json(nc);
  } catch (error) {
    console.error('Erreur GET /non-conformites:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const data = await request.json();

    const nc = await prisma.nonConformite.update({
      where: { id },
      data: {
        noProjet: data.noProjet,
        description: data.description,
        dateDetection: new Date(data.dateDetection),
        envoiMail: data.envoiMail,
        mesureCorrective: data.mesureCorrective,
        correction: data.correction,
        dateCorrection: data.dateCorrection ? new Date(data.dateCorrection) : null,
        confirmation: data.confirmation,
        departement: data.departementId ? { connect: { id: data.departementId } } : { disconnect: true },
        type: data.typeId ? { connect: { id: data.typeId } } : { disconnect: true },
        responsable: data.responsableId ? { connect: { id: data.responsableId } } : { disconnect: true },
      },
      include: {
        departement: true,
        type: true,
        responsable: true,
      },
    });

    return NextResponse.json(nc);
  } catch (error) {
    console.error('Erreur PUT /non-conformites:', error);
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

    await prisma.nonConformite.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erreur DELETE /non-conformites:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}