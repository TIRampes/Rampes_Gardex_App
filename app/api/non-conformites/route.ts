import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departementId = searchParams.get('departementId');
    const responsableId = searchParams.get('responsableId');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    const where: any = {};
    if (departementId) where.departementId = departementId;
    if (responsableId) where.responsableId = responsableId;
    if (dateDebut && dateFin) {
      where.dateDetection = {
        gte: new Date(dateDebut),
        lte: new Date(dateFin),
      };
    }

    const nonConformites = await prisma.nonConformite.findMany({
      where,
      include: {
        departement: true,
        type: true,
        responsable: true,
        commande: true,
      },
      orderBy: { dateDetection: 'desc' },
    });
    return NextResponse.json(nonConformites);
  } catch (error) {
    console.error('Erreur GET /non-conformites:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
// pour creer une nouvelle non-conformite, on envoie un POST avec les données de la nc (description, dateDetection, etc.) et les relations (departementId, typeId, responsableId)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Validation basique
    if (!data.description || !data.dateDetection) {
      return NextResponse.json({ error: 'Description et date requises' }, { status: 400 });
    }
    const nc = await prisma.nonConformite.create({
      data: {
        noProjet: data.noProjet || null,
        description: data.description,
        dateDetection: new Date(data.dateDetection),
        envoiMail: data.envoiMail || false,
        mesureCorrective: data.mesureCorrective || null,
        correction: data.correction || null,
        dateCorrection: data.dateCorrection ? new Date(data.dateCorrection) : null,
        confirmation: data.confirmation || false,
        departement: data.departementId ? { connect: { id: data.departementId } } : undefined,
        type: data.typeId ? { connect: { id: data.typeId } } : undefined,
        responsable: data.responsableId ? { connect: { id: data.responsableId } } : undefined,
      },
      include: {
        departement: true,
        type: true,
        responsable: true,
      },
    });
    return NextResponse.json(nc, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /non-conformites:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}