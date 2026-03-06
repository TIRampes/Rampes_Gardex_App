import { sendMailViaGraph } from '@/lib/microsoft-graph';
import { prisma } from '@/lib/prisma';
import { TYPE_REPRISE_MAP } from '@/app/api/reprises/schema';

// ╔══════════════════════════════════════════════════════════╗
// ║   EMAIL CONSEILS & PRÉVENTION — Microsoft Graph          ║
// ╚══════════════════════════════════════════════════════════╝

/**
 * Envoie un email de conseils & prévention à tous les employés
 * Appelé par le CRON tous les 3 jours
 */
export async function envoyerConseilsPrevention(): Promise<{
  envoyes: number;
  erreurs: string[];
}> {
  // 1. Récupérer les stats de reprises récentes (30 derniers jours)
  const depuis = new Date();
  depuis.setDate(depuis.getDate() - 30);

  const reprises = await prisma.reprise.findMany({
    where: { dateReprise: { gte: depuis } },
    select: { typeReprise: true, raison: true, nombreReprises: true },
  });

  if (reprises.length === 0) {
    return { envoyes: 0, erreurs: ['Aucune reprise dans les 30 derniers jours'] };
  }

  // 2. Calculer les stats par type
  const typeMap = new Map<string, { count: number; raisons: string[] }>();
  for (const r of reprises) {
    const existing = typeMap.get(r.typeReprise);
    if (existing) {
      existing.count++;
      if (r.raison && existing.raisons.length < 3) existing.raisons.push(r.raison);
    } else {
      typeMap.set(r.typeReprise, { count: 1, raisons: r.raison ? [r.raison] : [] });
    }
  }

  const statsParType = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      label: TYPE_REPRISE_MAP[type]?.label || type,
      icone: TYPE_REPRISE_MAP[type]?.icone || '📋',
      ...data,
      pourcentage: Math.round((data.count / reprises.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Récupérer tous les utilisateurs actifs
  const users = await prisma.user.findMany({
    where: { actif: true },
    select: { email: true, nom: true, prenom: true },
  });

  if (users.length === 0) {
    return { envoyes: 0, erreurs: ['Aucun utilisateur actif trouvé'] };
  }

  // 4. Générer le HTML
  const html = genererEmailConseils(reprises.length, statsParType);

  // 5. Envoyer à chaque utilisateur
  let envoyes = 0;
  const erreurs: string[] = [];

  for (const user of users) {
    try {
      const result = await sendMailViaGraph({
        to: user.email,
        toName: `${user.prenom} ${user.nom}`,
        subject: `🛡️ Conseils & Prévention — ${reprises.length} reprise(s) ce mois | Rampes Gardex`,
        htmlBody: html,
        importance: reprises.length > 10 ? 'high' : 'normal',
      });
      if (result.success) envoyes++;
      else erreurs.push(`${user.email}: ${result.error}`);
    } catch (e: any) {
      erreurs.push(`${user.email}: ${e.message}`);
    }
  }

  return { envoyes, erreurs };
}

function genererEmailConseils(
  totalReprises: number,
  statsParType: Array<{ type: string; label: string; icone: string; count: number; pourcentage: number; raisons: string[] }>
): string {
  const date = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const top3 = statsParType.slice(0, 3);

  const conseilsParType: Record<string, string[]> = {
    ERREURS_MESURE: [
      'Double vérification obligatoire par un second mesureur',
      'Photos systématiques de chaque point de mesure',
      'Formulaire standardisé avec checklist des points critiques',
    ],
    ERREURS_PRODUCTION: [
      'Validation croisée bon de coupe vs commande',
      'Contrôle dimensionnel post-coupe systématique',
      'Calibration quotidienne des machines',
    ],
    MAUVAISE_COULEUR: [
      'Code couleur standardisé au lieu de descriptions textuelles',
      'Confirmation client avec échantillon physique',
      'Étiquetage couleur + code sur chaque lot',
    ],
    PIECES_GRAFIGNEES: [
      'Emballage renforcé coins et surfaces',
      'Formation manipulation des pièces finies',
      'Inspection visuelle avant expédition',
    ],
    QUINCAILLERIE_MANQUANTE: [
      'Checklist de quincaillerie par type de commande',
      'Zone de préparation dédiée avec bacs identifiés',
      'Vérification en binôme avant emballage',
    ],
  };

  const lignesTypes = top3.map((t) => {
    const conseils = conseilsParType[t.type] || [
      'Analyser les causes racines de ce type de reprise',
      'Mettre en place une procédure de vérification',
      'Former les équipes sur les bonnes pratiques',
    ];
    return `
      <tr>
        <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 28px;">${t.icone}</span>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <strong style="font-size: 15px; color: #1e293b;">${t.label}</strong>
                <span style="background: #fee2e2; color: #991b1b; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">${t.count} cas (${t.pourcentage}%)</span>
              </div>
              <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0; font-weight: 600;">Mesures préventives recommandées :</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.8;">
                ${conseils.map((c) => `<li>${c}</li>`).join('')}
              </ul>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Calibri,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;padding:24px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr><td style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;"><tr>
          <td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1e293b;font-weight:900;font-size:20px;padding:10px 24px;border-radius:12px;letter-spacing:1.5px;">RAMPES GARDEX</td>
        </tr></table>
        <h1 style="color:white;font-size:22px;margin:20px 0 4px;font-weight:700;">🛡️ Conseils & Prévention</h1>
        <p style="color:#94a3b8;font-size:13px;margin:0;">${date} — Rapport automatique</p>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr><td style="background:white;padding:32px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        <p style="font-size:15px;color:#334155;margin:0 0 6px;">Bonjour à toute l'équipe,</p>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.7;">
          Au cours des 30 derniers jours, <strong style="color:#dc2626;font-size:16px;">${totalReprises}</strong> reprise(s) ont été enregistrées.
          Voici les types les plus fréquents et les mesures préventives recommandées.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
          <tr><td style="background:#fef2f2;padding:14px 20px;border-bottom:2px solid #fecaca;">
            <strong style="font-size:14px;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Top ${top3.length} — Types de reprises les plus fréquents</strong>
          </td></tr>
          ${lignesTypes}
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 0;">
          <tr><td style="background:linear-gradient(135deg,#0d9488,#0f766e);border-radius:10px;padding:14px 32px;text-align:center;">
            <span style="color:white;font-size:14px;font-weight:700;">Ensemble, réduisons les reprises — Merci pour votre vigilance !</span>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr><td style="background:#1e293b;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Ce message a été envoyé automatiquement (tous les 3 jours) par le système Rampes Gardex via Microsoft 365.</p>
        <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} Rampes Gardex inc. — Tous droits réservés</p>
      </td></tr>
    </table>
  </div>
</body></html>`;
}