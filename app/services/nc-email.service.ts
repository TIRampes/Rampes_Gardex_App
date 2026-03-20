import { sendMailViaGraph } from '@/lib/microsoft-graph';
import { prisma } from '@/lib/prisma';

/**
 * Envoie un email de notification pour une nouvelle Non-Conformité
 */
export async function notifierResponsableNC(ncId: string) {
  const nc = await prisma.nonConformite.findUnique({
    where: { id: ncId },
    include: { responsable: true, departement: true, type: true }
  });

  if (!nc || !nc.responsable?.email) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #1e293b; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Nouvelle Non-Conformité</h2>
      </div>
      <div style="padding: 24px; color: #334155;">
        <p>Bonjour <strong>${nc.responsable.nom}</strong>,</p>
        <p>Une nouvelle non-conformité vous a été assignée :</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Projet :</strong> ${nc.noProjet || 'N/A'}</p>
          <p><strong>Type :</strong> ${nc.type?.nom || 'N/A'}</p>
          <p><strong>Département :</strong> ${nc.departement?.nom || 'N/A'}</p>
          <p><strong>Description :</strong> ${nc.description}</p>
        </div>
        <p>Merci de prendre les mesures correctives nécessaires dans les plus brefs délais.</p>
      </div>
    </div>
  `;

  await sendMailViaGraph({
    to: nc.responsable.email,
    toName: nc.responsable.nom,
    subject: `⚠️ NC Assignée : ${nc.noProjet || 'Nouveau signalement'}`,
    htmlBody: html,
    importance: 'high'
  });
}

/**
 * Vérifie le nombre de NC et envoie un avertissement si besoin
 */
export async function verifierSeuilAlerteResponsable(responsableId: string) {
  const responsable = await prisma.responsableNC.findUnique({ where: { id: responsableId } });
  if (!responsable || !responsable.email) return;

  // Compter les NC non résolues (ou toutes les NC du mois, selon votre choix)
  const count = await prisma.nonConformite.count({
    where: { 
      responsableId,
      statut: { not: 'RESOLU' } // On compte celles qui sont encore ouvertes
    }
  });

  if (count >= 3) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; border: 2px solid #ef4444; border-radius: 12px; padding: 24px;">
        <h2 style="color: #b91c1c;">⚠️ Rappel de Vigilance</h2>
        <p>Bonjour <strong>${responsable.nom}</strong>,</p>
        <p>Le système a détecté que vous avez actuellement <strong>${count} non-conformités</strong> actives à votre nom.</p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="color: #991b1b; font-weight: bold; margin: 0;">Une attention particulière est requise.</p>
          <p style="margin: 5px 0 0 0;">Merci de faire le point sur vos processus pour limiter ces écarts.</p>
        </div>
      </div>
    `;

    await sendMailViaGraph({
      to: responsable.email,
      toName: responsable.nom,
      subject: `🚨 Alerte Vigilance : ${count} Non-Conformités actives`,
      htmlBody: html,
      importance: 'high'
    });
  }
}