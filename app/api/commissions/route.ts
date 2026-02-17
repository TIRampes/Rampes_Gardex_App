import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const representantId = searchParams.get('representantId');
    const statut = searchParams.get('statut');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    const where: any = {};
    
    if (representantId) where.representantId = representantId;
    if (statut) where.statut = statut;
    if (dateDebut || dateFin) {
      where.dateSoumission = {};
      if (dateDebut) where.dateSoumission.gte = new Date(dateDebut);
      if (dateFin) where.dateSoumission.lte = new Date(dateFin);
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        commande: {
          include: {
            client: true
          }
        },
        representant: true
      },
      orderBy: { dateSoumission: 'desc' }
    });

    return NextResponse.json(commissions);
  } catch (error) {
    console.error("Erreur GET commissions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des commissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Calcul automatique de la commission
    const montantCommission = (body.montantSoumission * body.pourcentage) / 100;

    const commission = await prisma.commission.create({
      data: {
        commandeId: body.commandeId,
        representantId: body.representantId,
        montantSoumission: body.montantSoumission,
        pourcentage: body.pourcentage,
        montantCommission,
        statut: "EN_ATTENTE",
        typeCommission: body.typeCommission || "SOUMISSION",
        dateSoumission: new Date(body.dateSoumission),
        depotGarantie: body.depotGarantie,
        notes: body.notes,
      },
      include: {
        commande: {
          include: {
            client: true
          }
        },
        representant: true
      }
    });

    return NextResponse.json(commission, { status: 201 });
  } catch (error) {
    console.error("Erreur POST commission:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la commission" },
      { status: 500 }
    );
  }
}