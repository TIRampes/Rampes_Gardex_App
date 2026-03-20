// app/services/reprises-email.service.ts

import { sendMailViaGraph } from '@/lib/microsoft-graph';
import { prisma } from '@/lib/prisma';
import { TYPE_REPRISE_MAP } from '@/app/api/reprises/schema';

/**
 * Service pour envoyer les conseils de prévention basés sur les données réelles des reprises
 */
export async function envoyerConseilsPrevention(): Promise<{
  envoyes: number;
  erreurs: string[];
}> {
  // 1. Récupérer les données des 30 derniers jours pour l'analyse
  const depuis = new Date();
  depuis.setDate(depuis.getDate() - 30);

  const reprises = await prisma.reprise.findMany({
    where: { dateReprise: { gte: depuis } },
    select: { typeReprise: true, raison: true }
  });

  if (reprises.length === 0) {
    return { envoyes: 0, erreurs: ['Aucune reprise enregistrée sur les 30 derniers jours. Analyse impossible.'] };
  }

  // 2. Calcul des statistiques par type
  const typeMap = new Map<string, { count: number }>();
  reprises.forEach(r => {
    typeMap.set(r.typeReprise, { count: (typeMap.get(r.typeReprise)?.count || 0) + 1 });
  });

  const statsParType = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      label: TYPE_REPRISE_MAP[type]?.label || type,
      icone: TYPE_REPRISE_MAP[type]?.icone || '📋',
      count: data.count,
      pourcentage: Math.round((data.count / reprises.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Récupérer tous les utilisateurs actifs pour l'envoi
  const users = await prisma.user.findMany({
    where: { actif: true },
    select: { email: true, nom: true, prenom: true }
  });

  if (users.length === 0) {
    return { envoyes: 0, erreurs: ['Aucun employé actif trouvé dans la base de données.'] };
  }

  // 4. Générer le contenu de l'email
  const html = genererEmailHTMLConseils(reprises.length, statsParType);
  let envoyesCount = 0;
  const erreursList: string[] = [];

  // 5. Boucle d'envoi individuelle avec validation d'email
  for (const user of users) {
    const emailAUtiliser = user.email ? user.email.trim() : "";

    // VALIDATION : Si l'email ne contient pas d'arobase ou est un nom, on ignore pour éviter l'erreur 400
    if (!emailAUtiliser || !emailAUtiliser.includes('@')) {
      const msg = `Format d'email invalide ignoré pour ${user.prenom} ${user.nom}: "${emailAUtiliser}"`;
      console.error(`⚠️ ${msg}`);
      erreursList.push(msg);
      continue; 
    }

    try {
      const result = await sendMailViaGraph({
        to: emailAUtiliser,
        toName: `${user.prenom} ${user.nom}`,
        subject: `🛡️ Prévention : Rapport mensuel sur les ${reprises.length} reprises | Rampes Gardex`,
        htmlBody: html,
        importance: reprises.length > 5 ? 'high' : 'normal'
      });

      if (result.success) {
        envoyesCount++;
      } else {
        erreursList.push(`${emailAUtiliser}: ${result.error}`);
      }
    } catch (e: any) {
      erreursList.push(`${emailAUtiliser}: ${e.message}`);
    }
  }

  console.log(`✅ Fin de l'envoi de prévention: ${envoyesCount} réussis, ${erreursList.length} erreurs.`);
  return { envoyes: envoyesCount, erreurs: erreursList };
}

/**
 * Générateur de Template HTML Professionnel
 */
function genererEmailHTMLConseils(total: number, stats: any[]): string {
  const dateStr = new Date().toLocaleDateString('fr-CA', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  
  const top3 = stats.slice(0, 3);

  const lignesTypes = top3.map(t => `
    <tr>
      <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="font-size: 24px;">${t.icone}</span>
          <strong style="font-size: 16px; color: #1e293b;">${t.label}</strong>
          <span style="margin-left: auto; background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${t.count} cas (${t.pourcentage}%)
          </span>
        </div>
        <p style="margin: 5px 0 0 0; color: #475569; font-size: 14px; line-height: 1.5;">
          <strong>Mesure recommandée :</strong> Sensibilisation de l'équipe sur ce point et vérification systématique avant l'étape suivante.
        </p>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; padding: 40px 30px; text-align: center;">
          <div style="background: #fbbf24; color: #1e293b; display: inline-block; padding: 8px 20px; border-radius: 8px; font-weight: 900; font-size: 14px; letter-spacing: 1px; margin-bottom: 15px;">
            RAMPES GARDEX
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🛡️ CONSEILS & PRÉVENTION</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 14px;">${dateStr}</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #334155;">Bonjour à toute l'équipe,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Dans notre démarche d'amélioration continue, nous avons analysé les <strong>${total} reprises</strong> de ce mois-ci. 
            Voici les 3 domaines nécessitant une vigilance accrue pour réduire les erreurs :
          </p>

          <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; overflow: hidden;">
            ${lignesTypes}
          </table>

          <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 12px; text-align: center; border: 1px solid #bbf7d0;">
            <strong style="color: #166534; font-size: 14px;">"La qualité, c'est de bien faire les choses même quand personne ne regarde."</strong>
            <p style="margin: 5px 0 0 0; color: #15803d; font-size: 13px;">Travaillons ensemble pour viser le zéro erreur.</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
            Ce rapport automatisé est envoyé tous les 3 jours par le système ERP Rampes Gardex.<br>
            © ${new Date().getFullYear()} Rampes Gardex inc. — Tous droits réservés.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}