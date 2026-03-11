import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACHAT_TYPES } from '@/app/api/achats/schema';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/achats/commandes/[id]/livraison — marquer la commande comme livrée (achats)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const commande = await prisma.commande.findUnique({ where: { id } });
    if (!commande) return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });

    // Mettre tous les achats actifs à RECEPTIONNE + date de réception = maintenant
    const updateData: Record<string, unknown> = {
      statutLivraison: 'LIVRE',
      dateLivraison: new Date(),
    };

    const now = new Date();
    for (const t of ACHAT_TYPES) {
      const statutVal = (commande as any)[t.prismaStatut];
      if (statutVal != null) {
        updateData[t.prismaStatut] = 'RECEPTIONNE';
        // Ne remplacer la date de réception que si elle n'existe pas déjà
        if (!(commande as any)[t.prismaRecep]) {
          updateData[t.prismaRecep] = now;
        }
      }
    }

    const updated = await prisma.commande.update({ where: { id }, data: updateData });

    return NextResponse.json({ message: 'Livraison validée', commande: updated });
  } catch (error) {
    console.error('POST /api/achats/commandes/[id]/livraison erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}