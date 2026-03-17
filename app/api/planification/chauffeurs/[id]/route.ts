import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const c = await prisma.chauffeur.update({ where: { id }, data: { nom: body.nom, telephone: body.telephone || null, permis: body.permis || null } });
    return NextResponse.json(c);
  } catch (error) { console.error('PUT chauffeur:', error); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.chauffeur.update({ where: { id }, data: { actif: false } });
    return NextResponse.json({ message: 'Chauffeur désactivé' });
  } catch (error) { console.error('DELETE chauffeur:', error); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }
}