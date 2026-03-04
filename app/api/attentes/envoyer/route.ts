// app/api/attentes/envoyer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/graph';
import { CodeProduction } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { representantIds } = await request.json();

    // Récupérer les représentants concernés
    const representants = await prisma.representant.findMany({
      where: representantIds?.length
        ? { id: { in: representantIds } }
        : {}, // si vide, on prendra tous ceux qui ont des attentes plus tard
    });

    if (representants.length === 0) {
      return NextResponse.json(
        { error: 'Aucun représentant sélectionné' },
        { status: 400 }
      );
    }

    // Pour chaque représentant, trouver ses commandes en attente
    const attenteCodes: CodeProduction[] = [
      'ATTENTE_CLIENT',
      'ATTENTE_REPRESENTANT',
      'ATTENTE_CAROL_CONFIRM',
      'ATTENTE_CAROL_MESURE',
      'BACK_ORDER',
    ];

    const resultats = [];

    for (const rep of representants) {
      const commandes = await prisma.commande.findMany({
        where: {
          representantId: rep.id,
          OR: [
            { mesure: { in: attenteCodes } },
            { plan: { in: attenteCodes } },
            { envoyeProduction: { in: attenteCodes } },
            { productionTerminee: { in: attenteCodes } },
            { termine: { in: attenteCodes } },
          ],
        },
        include: {
          client: true,
        },
      });

      if (commandes.length === 0) continue;

      // Construire le contenu de l'email
      let body = `Bonjour ${rep.nom},\n\nVoici la liste de vos commandes en attente :\n\n`;
      commandes.forEach((cmd) => {
        body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        body += `📋 Projet #${cmd.numero}\n`;
        body += `👤 Client: ${cmd.client?.nom || 'Inconnu'}\n`;
        body += `📍 Adresse: ${cmd.adresse || ''}\n`;
        body += `📞 Téléphone: ${cmd.client?.telephone || ''}\n`;
        body += `📅 Date d'entrée: ${cmd.dateEntree.toLocaleDateString('fr-CA')}\n`;
        body += `📅 Date prévue: ${cmd.datePrevue?.toLocaleDateString('fr-CA') || '—'}\n`;
        body += `🔧 Service: ${cmd.service}\n`;
        body += `📏 Pieds linéaires: ${cmd.piedsLineairesRampes || 0}\n`;
        body += `🎨 Couleur: ${cmd.couleur || '—'}\n`;
        body += `📝 Notes: ${cmd.commentaire || 'Aucune'}\n\n`;
      });
      body += `\nMerci de faire le suivi de ces dossiers.\n\nCordialement,\nRampes Gardex`;

      // Envoyer l'email
      if (rep.email) {
        await sendEmail([rep.email], 'Vos commandes en attente', body);
      }

      // Marquer les commandes comme envoyées
      await prisma.commande.updateMany({
        where: { id: { in: commandes.map(c => c.id) } },
        data: {
          attenteEnvoyee: true,
          dateDernierEnvoiAttente: new Date(),
        },
      });

      resultats.push({
        representant: rep.nom,
        count: commandes.length,
        email: rep.email,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${resultats.length} email(s) envoyé(s)`,
      details: resultats,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des emails' },
      { status: 500 }
    );
  }
}