import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Récupérer toutes les commandes avec reprise = true
    const commandes = await prisma.commande.findMany({
      where: { reprise: true },
      include: { client: true }, // nécessaire pour récupérer clientId
    });

    let compteur = 0;

    for (const cmd of commandes) {
      // Vérifier si une reprise existe déjà pour cette commande
      const existe = await prisma.reprise.findFirst({
        where: { commandeId: cmd.id },
      });

      if (!existe) {
        // Créer une reprise avec des valeurs par défaut
        await prisma.reprise.create({
          data: {
            commandeId: cmd.id,
            clientId: cmd.clientId,
            typeReprise: 'AUTRE',               // valeur par défaut (à ajuster selon votre métier)
            raison: 'Commande marquée comme reprise (création automatique)',
            dateReprise: cmd.updatedAt,          // ou new Date()
            statut: 'PLANIFIEE',
            priorite: 'MOYENNE',
            nombreReprises: 1,
            completee: false,
            // Les champs optionnels peuvent rester null
          },
        });
        compteur++;
      }
    }

    return NextResponse.json({
      message: `${compteur} reprise(s) créée(s) avec succès.`,
    });
  } catch (error) {
    console.error('Erreur populate reprises :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}