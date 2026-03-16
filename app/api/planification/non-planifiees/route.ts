// app/api/planification/non-planifiees/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CommandeNonPlanifiee } from "@/app/api/planification/schema";

export async function GET() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        statut: 'ACTIVE',
        // On prend toutes les commandes actives sans planification non annulée
        planifications: { none: { statut: { notIn: ['ANNULEE'] } } },
      },
      include: { client: { select: { nom: true, ville: true } } },
      orderBy: { dateEntree: 'asc' },
    });

    const result: CommandeNonPlanifiee[] = commandes.map((c) => ({
      id: c.id,
      numero: c.numero,
      clientNom: c.client?.nom || '—',
      clientVille: c.client?.ville || null,
      adresse: c.adresse,
      typeCommande: c.typeCommande,
      service: c.service,
      tempsEstimeInstallation: c.tempsEstimeInstallation || 0,
      piedsLineaires: c.piedsLineairesRampes || 0,
      couleur: c.couleurPersonnalisee || c.couleur || null,
      datePrevue: c.datePrevue, // AJOUTÉ
    }));

    return NextResponse.json({ commandes: result });
  } catch (error) {
    console.error('GET non-planifiees erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}