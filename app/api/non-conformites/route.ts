import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifierResponsableNC, verifierSeuilAlerteResponsable } from '@/app/services/nc-email.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departementId = searchParams.get('departementId');
    const responsableId = searchParams.get('responsableId');

    const where: any = {};
    if (departementId) where.departementId = departementId;
    if (responsableId) where.responsableId = responsableId;

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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
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
        statut: 'OUVERT',
        departement: data.departementId ? { connect: { id: data.departementId } } : undefined,
        type: data.typeId ? { connect: { id: data.typeId } } : undefined,
        responsable: data.responsableId ? { connect: { id: data.responsableId } } : undefined,
      }
    });

    // --- LOGIQUE D'EMAIL AUTOMATIQUE ---
    if (data.envoiMail && data.responsableId) {
      // 1. Envoi du mail de notification au responsable
      await notifierResponsableNC(nc.id);
      
      // 2. Vérification si on atteint le seuil d'alerte (3 NC)
      await verifierSeuilAlerteResponsable(data.responsableId);
    }

    return NextResponse.json(nc, { status: 201 });
  } catch (error) {
    console.error('Erreur POST NC:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}