import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET() {
  try {
    const responsables = await prisma.responsableNC.findMany({
      orderBy: { nom: 'asc' },
    });
    return NextResponse.json(responsables);
  } catch (error) {
    console.error('Erreur GET /responsables:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nom, email } = await request.json();
    if (!nom || typeof nom !== 'string' || nom.trim() === '') {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }
    const responsable = await prisma.responsableNC.create({
      data: { 
        nom: nom.trim(), 
        email: email && typeof email === 'string' ? email.trim() : null 
      },
    });
    return NextResponse.json(responsable, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /responsables:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}