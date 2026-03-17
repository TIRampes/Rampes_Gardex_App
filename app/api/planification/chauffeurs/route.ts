import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChauffeurCreateSchema } from '@/app/api/planification/schema';

export async function GET() {
  try {
    const chauffeurs = await prisma.chauffeur.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } });
    return NextResponse.json({ chauffeurs });
  } catch (error) { console.error('GET chauffeurs:', error); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ChauffeurCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    const c = await prisma.chauffeur.create({ data: parsed.data });
    return NextResponse.json(c, { status: 201 });
  } catch (error) { console.error('POST chauffeur:', error); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }
}