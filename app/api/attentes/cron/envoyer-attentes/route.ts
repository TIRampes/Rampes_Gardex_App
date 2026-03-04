// app/api/cron/envoyer-attentes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/graph';
import { CodeProduction } from '@prisma/client';

// Clé secrète pour sécuriser l'appel du cron (à mettre dans .env)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Vérification de sécurité
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // Récupérer tous les représentants actifs
    const representants = await prisma.representant.findMany({
      where: { actif: true },
    });

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

      // Construire le corps de l'email (identique à l'envoi manuel)
      let body = `Bonjour ${rep.nom},\n\nVoici la liste de vos commandes en attente (envoi automatique du lundi) :\n\n`;
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

      if (rep.email) {
        await sendEmail([rep.email], 'Rappel hebdomadaire : vos commandes en attente', body);
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
      message: `${resultats.length} email(s) envoyé(s) automatiquement`,
      details: resultats,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi automatique' },
      { status: 500 }
    );
  }
}