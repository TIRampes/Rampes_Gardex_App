import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CommandeNonPlanifiee } from '@/app/api/planification/schema';

export async function GET() {
  try {
    // Toutes les commandes ACTIVE qui n'ont AUCUNE planification
    const commandes = await prisma.commande.findMany({
      where: {
        statut: 'ACTIVE',
        planifications: { none: {} },
      },
      include: {
        client: { select: { nom: true, ville: true } },
      },
      orderBy: [{ service: 'asc' }, { datePrevue: 'asc' }, { dateEntree: 'asc' }],
    });

    const result: CommandeNonPlanifiee[] = commandes.map((c) => ({
      id: c.id,
      numero: c.numero,
      clientNom: c.client?.nom || '—',
      clientVille: c.client?.ville || null,
      adresse: c.adresse || '',
      typeCommande: c.typeCommande || 'STANDARD',
      service: c.service || 'INSTALLATION',
      datePrevue: c.datePrevue ? c.datePrevue.toISOString() : null,
      tempsEstimeInstallation: c.tempsEstimeInstallation || 0,
      piedsLineaires: c.piedsLineairesRampes || 0,
      couleur: c.couleurPersonnalisee || c.couleur || null,
    }));

    return NextResponse.json({ commandes: result });
  } catch (error) {
    console.error('GET /api/planification/non-planifiees erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur', commandes: [] }, { status: 500 });
  }
}