import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET() {
  try {
    const departements = await prisma.departementNC.findMany({
      orderBy: { nom: 'asc' },
    });
    return NextResponse.json(departements);
  } catch (error) {
    console.error('Erreur GET /departements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nom } = await request.json();
    if (!nom || typeof nom !== 'string' || nom.trim() === '') {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }
    const dept = await prisma.departementNC.create({
      data: { nom: nom.trim() },
    });
    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /departements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}