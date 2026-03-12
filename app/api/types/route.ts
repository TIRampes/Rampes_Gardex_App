import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departementId = searchParams.get('departementId');

    const where = departementId ? { departementId } : {};
    const types = await prisma.typeNC.findMany({
      where,
      include: { departement: true },
      orderBy: { nom: 'asc' },
    });
    return NextResponse.json(types);
  } catch (error) {
    console.error('Erreur GET /types:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nom, departementId } = await request.json();
    if (!nom || typeof nom !== 'string' || nom.trim() === '') {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }
    if (!departementId) {
      return NextResponse.json({ error: 'Département requis' }, { status: 400 });
    }
    const type = await prisma.typeNC.create({
      data: { nom: nom.trim(), departementId },
      include: { departement: true },
    });
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /types:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}