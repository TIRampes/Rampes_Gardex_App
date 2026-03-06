import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RepriseUpdateSchema } from '@/app/api/reprises/schema';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/reprises/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = RepriseUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: any = { ...parsed.data };

    // Convertir les dates string en Date
    if (data.dateReprise) data.dateReprise = new Date(data.dateReprise);
    if (data.dateOrigine) data.dateOrigine = new Date(data.dateOrigine);

    const reprise = await prisma.reprise.update({
      where: { id },
      data,
    });

    return NextResponse.json(reprise);
  } catch (error) {
    console.error('PUT /api/reprises/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/reprises/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.reprise.delete({ where: { id } });
    return NextResponse.json({ message: 'Reprise supprimée' });
  } catch (error) {
    console.error('DELETE /api/reprises/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}