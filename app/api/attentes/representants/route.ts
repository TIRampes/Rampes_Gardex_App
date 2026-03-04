// app/api/attentes/representants/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const representants = await prisma.representant.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    });
    return NextResponse.json(representants);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des représentants' },
      { status: 500 }
    );
  }
}