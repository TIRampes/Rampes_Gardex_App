import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VehiculeCreateSchema } from '@/app/api/planification/schema';

export async function GET() {
  try {
    const vehicules = await prisma.vehicule.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } });
    return NextResponse.json({ vehicules });
  } catch (error) { console.error('GET vehicules:', error); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VehiculeCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    const v = await prisma.vehicule.create({ data: parsed.data });
    return NextResponse.json(v, { status: 201 });
  } catch (error) { console.error('POST vehicule:', error); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }
}