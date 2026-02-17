import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const commission = await prisma.commission.findUnique({
      where: { id },
      include: {
        commande: {
          include: {
            client: true
          }
        },
        representant: true
      }
    });

    if (!commission) {
      return NextResponse.json({ error: "Commission non trouvée" }, { status: 404 });
    }

    return NextResponse.json(commission);
  } catch (error) {
    console.error("Erreur GET commission:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Recalcul de la commission si montant ou pourcentage change
    const montantCommission = body.montantSoumission && body.pourcentage
      ? (body.montantSoumission * body.pourcentage) / 100
      : undefined;

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        montantSoumission: body.montantSoumission,
        pourcentage: body.pourcentage,
        montantCommission,
        statut: body.statut,
        paye: body.paye,
        datePaiement: body.paye ? new Date() : null,
        numeroFacture: body.numeroFacture,
        depotGarantie: body.depotGarantie,
        motifDeficience: body.motifDeficience,
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

    return NextResponse.json(commission);
  } catch (error) {
    console.error("Erreur PUT commission:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}