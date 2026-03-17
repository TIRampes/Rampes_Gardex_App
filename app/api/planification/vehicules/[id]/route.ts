import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const v = await prisma.vehicule.update({ where: { id }, data: { nom: body.nom, type: body.type, plaque: body.plaque } });
    return NextResponse.json(v);
  } catch (error) { console.error('PUT vehicule:', error); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.vehicule.update({ where: { id }, data: { actif: false } });
    return NextResponse.json({ message: 'Véhicule désactivé' });
  } catch (error) { console.error('DELETE vehicule:', error); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }
}