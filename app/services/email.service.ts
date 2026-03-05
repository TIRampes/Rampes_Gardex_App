import { prisma } from '@/lib/prisma';
import { sendMailViaGraph } from '@/lib//microsoft-graph';
import type { CommandeAttente, Representant } from '@/app/api/attentes/schema';
import { codeProductionCourt, genererInitiales, getServiceLabel } from '@/app/api/attentes/schema';

// ╔══════════════════════════════════════════════════════════╗
// ║   SERVICE EMAIL ATTENTES — via Microsoft Graph API       ║
// ╚══════════════════════════════════════════════════════════╝

/**
 * Envoie un email professionnel à un représentant avec ses commandes en attente
 */
export async function envoyerEmailAttentes(
  representant: Representant,
  commandes: CommandeAttente[],
  notesSupplementaires?: string
): Promise<{ success: boolean; error?: string }> {
  if (!representant.email) {
    return { success: false, error: 'Aucun email configuré pour ce représentant' };
  }

  if (commandes.length === 0) {
    return { success: false, error: 'Aucune commande en attente' };
  }

  const prenom = representant.nom.split(' ')[0] || representant.nom;
  const dateAujourdhui = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const html = genererEmailHTML(prenom, representant.nom, commandes, dateAujourdhui, notesSupplementaires);
  const sujet = `📋 Rappel — ${commandes.length} commande${commandes.length > 1 ? 's' : ''} en attente de suivi`;

  try {
    const result = await sendMailViaGraph({
      to: representant.email,
      toName: representant.nom,
      subject: sujet,
      htmlBody: html,
      importance: commandes.length >= 5 ? 'high' : 'normal',
    });

    if (!result.success) {
      console.error(`❌ Erreur email ${representant.email}:`, result.error);

      await prisma.envoiAttente.create({
        data: {
          representantId: representant.id,
          dateEnvoi: new Date(),
          type: 'INDIVIDUEL',
          nbCommandes: commandes.length,
          statut: 'ERREUR',
          erreur: result.error?.substring(0, 500) || 'Erreur Graph API',
        },
      });

      return { success: false, error: result.error };
    }

    // Enregistrer l'envoi réussi en BD
    await prisma.envoiAttente.create({
      data: {
        representantId: representant.id,
        dateEnvoi: new Date(),
        type: 'INDIVIDUEL',
        nbCommandes: commandes.length,
        statut: 'ENVOYE',
        commandes: {
          connect: commandes.map((c) => ({ id: c.id })),
        },
      },
    });

    console.log(`✅ Email Graph envoyé à ${representant.nom} (${representant.email}) — ${commandes.length} commande(s)`);
    return { success: true };
  } catch (err: any) {
    console.error(`❌ Exception email ${representant.email}:`, err);

    await prisma.envoiAttente.create({
      data: {
        representantId: representant.id,
        dateEnvoi: new Date(),
        type: 'INDIVIDUEL',
        nbCommandes: commandes.length,
        statut: 'ERREUR',
        erreur: err.message?.substring(0, 500),
      },
    });

    return { success: false, error: err.message };
  }
}

/**
 * Envoie les attentes groupées à plusieurs représentants
 */
export async function envoyerAttentesGroupees(
  representantIds: string[],
  toutesCommandes: CommandeAttente[],
  representants: Representant[],
  notes?: string
): Promise<{ total: number; envoyes: number; erreurs: string[] }> {
  let envoyes = 0;
  const erreurs: string[] = [];

  for (const repId of representantIds) {
    const rep = representants.find((r) => r.id === repId);
    if (!rep) continue;

    const commandesRep = toutesCommandes.filter((c) => c.representantId === repId);
    if (commandesRep.length === 0) continue;

    const result = await envoyerEmailAttentes(rep, commandesRep, notes);
    if (result.success) {
      envoyes++;
    } else {
      erreurs.push(`${rep.nom}: ${result.error}`);
    }
  }

  return { total: representantIds.length, envoyes, erreurs };
}

// ╔══════════════════════════════════════════════════════════╗
// ║          TEMPLATE HTML EMAIL ULTRA PROFESSIONNEL          ║
// ╚══════════════════════════════════════════════════════════╝

function genererEmailHTML(
  prenom: string,
  nomComplet: string,
  commandes: CommandeAttente[],
  dateAujourdhui: string,
  notes?: string
): string {
  const lignesCommandes = commandes.map((cmd, i) => {
    const mesure = codeProductionCourt(cmd.mesure);
    const plan = codeProductionCourt(cmd.plan);
    const envProd = codeProductionCourt(cmd.envoyeProduction);
    const prodTerm = codeProductionCourt(cmd.productionTerminee);
    const termine = codeProductionCourt(cmd.termine);
    const service = getServiceLabel(cmd.service);
    const dateEntree = cmd.dateEntree ? new Date(cmd.dateEntree).toLocaleDateString('fr-CA') : '—';
    const datePrevue = cmd.datePrevue ? new Date(cmd.datePrevue).toLocaleDateString('fr-CA') : '—';

    const svcColor = cmd.service === 'INSTALLATION' ? '#ef4444'
      : cmd.service === 'LIVRAISON' ? '#3b82f6'
      : cmd.service === 'CUEILLETTE' ? '#eab308'
      : '#22c55e';

    const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';

    return `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e293b; font-size: 14px; vertical-align: top;">
          #${cmd.numero}
          ${cmd.commentaire ? `<br><span style="font-weight: 400; font-size: 11px; color: #64748b; line-height: 1.4; display: inline-block; margin-top: 3px;">${cmd.commentaire.split('\n')[0].substring(0, 80)}${cmd.commentaire.length > 80 ? '…' : ''}</span>` : ''}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
          <strong style="color: #1e293b; font-size: 13px;">${cmd.clientNom}</strong>
          ${cmd.clientTelephone ? `<br><span style="font-size: 11px; color: #64748b;">📞 ${cmd.clientTelephone}</span>` : ''}
          ${cmd.clientAdresse ? `<br><span style="font-size: 11px; color: #94a3b8;">📍 ${cmd.clientAdresse.substring(0, 50)}</span>` : ''}
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; vertical-align: top;">
          <span style="display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; color: white; background-color: ${svcColor};">${service}</span>
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #475569; vertical-align: top;">
          <span style="font-weight: 600;">${dateEntree}</span><br>
          <span style="color: #94a3b8; font-size: 11px;">${datePrevue}</span>
        </td>
        <td style="padding: 14px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; vertical-align: top;">${fmtCode(mesure)}</td>
        <td style="padding: 14px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; vertical-align: top;">${fmtCode(plan)}</td>
        <td style="padding: 14px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; vertical-align: top;">${fmtCode(envProd)}</td>
        <td style="padding: 14px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; vertical-align: top;">${fmtCode(prodTerm)}</td>
        <td style="padding: 14px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; vertical-align: top;">${fmtCode(termine)}</td>
      </tr>`;
  }).join('');

  const nbClient = commandes.filter((c) => c.typeAttente === 'client').length;
  const nbRep = commandes.filter((c) => c.typeAttente === 'representant').length;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attentes - Rampes Gardex</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Calibri, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!--[if mso]><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><![endif]-->
  <div style="max-width: 920px; margin: 0 auto; padding: 24px 16px;">

    <!-- ═══════ HEADER ═══════ -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px 16px 0 0; padding: 36px 40px; text-align: center;">
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
            <tr>
              <td style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1e293b; font-weight: 900; font-size: 22px; padding: 12px 28px; border-radius: 12px; letter-spacing: 1.5px; font-family: Calibri, Arial, sans-serif;">
                RAMPES GARDEX
              </td>
            </tr>
          </table>
          <h1 style="color: white; font-size: 26px; margin: 24px 0 6px 0; font-weight: 700; letter-spacing: -0.3px;">
            Rappel des commandes en attente
          </h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">${dateAujourdhui}</p>
        </td>
      </tr>
    </table>

    <!-- ═══════ BODY ═══════ -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td style="background: white; padding: 36px 40px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">

          <!-- Salutation -->
          <p style="font-size: 17px; color: #334155; margin: 0 0 8px 0; font-weight: 600;">
            Bonjour ${prenom},
          </p>
          <p style="font-size: 14px; color: #64748b; margin: 0 0 28px 0; line-height: 1.7;">
            Vous avez actuellement <strong style="color: #0d9488; font-size: 17px; background: #f0fdfa; padding: 2px 8px; border-radius: 6px;">${commandes.length}</strong> commande${commandes.length > 1 ? 's' : ''} en attente de suivi. Merci de faire le nécessaire pour chacune d'entre elles afin de maintenir un délai de traitement optimal.
          </p>

          ${notes ? `
          <!-- Note personnalisée -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
            <tr>
              <td style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 0 10px 10px 0; padding: 16px 20px;">
                <p style="font-size: 11px; font-weight: 700; color: #92400e; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.8px;">
                  📝 Note de l'expéditeur
                </p>
                <p style="font-size: 14px; color: #78350f; margin: 0; line-height: 1.6;">${notes}</p>
              </td>
            </tr>
          </table>
          ` : ''}

          <!-- ═══════ BADGES RÉSUMÉ ═══════ -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
            <tr>
              <td width="33%" style="padding-right: 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="font-size: 32px; font-weight: 800; color: #0d9488; margin: 0; line-height: 1;">${commandes.length}</p>
                      <p style="font-size: 11px; color: #5eead4; margin: 6px 0 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total en attente</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="33%" style="padding: 0 4px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="font-size: 32px; font-weight: 800; color: #2563eb; margin: 0; line-height: 1;">${nbClient}</p>
                      <p style="font-size: 11px; color: #93c5fd; margin: 6px 0 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Attente client</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="33%" style="padding-left: 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="font-size: 32px; font-weight: 800; color: #7c3aed; margin: 0; line-height: 1;">${nbRep}</p>
                      <p style="font-size: 11px; color: #c4b5fd; margin: 6px 0 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Attente rep.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- ═══════ TABLEAU PRINCIPAL ═══════ -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; border-collapse: separate; border-spacing: 0;">
            <thead>
              <tr style="background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);">
                <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 2px solid #cbd5e1;">Projet</th>
                <th style="padding: 14px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 2px solid #cbd5e1;">Client</th>
                <th style="padding: 14px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1;">Service</th>
                <th style="padding: 14px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1;">Dates</th>
                <th style="padding: 14px 8px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1;">Mes.</th>
                <th style="padding: 14px 8px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1;">Plan</th>
                <th style="padding: 14px 8px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1;">Env.P</th>
                <th style="padding: 14px 8px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1;">Prod.</th>
                <th style="padding: 14px 8px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1;">Term.</th>
              </tr>
            </thead>
            <tbody>
              ${lignesCommandes}
            </tbody>
          </table>

          <!-- ═══════ LÉGENDE ═══════ -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
            <tr>
              <td style="padding: 16px 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p style="font-size: 11px; font-weight: 700; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Légende des codes</p>
                <p style="font-size: 12px; color: #475569; margin: 0; line-height: 2;">
                  <span style="font-weight: 700; color: #16a34a; font-size: 14px;">√</span> = Complété &nbsp;&nbsp;│&nbsp;&nbsp;
                  <span style="background: #bae6fd; color: #0c4a6e; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">At.C</span> = Attente client &nbsp;&nbsp;│&nbsp;&nbsp;
                  <span style="background: #e9d5ff; color: #581c87; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">At.Rep</span> = Attente représentant &nbsp;&nbsp;│&nbsp;&nbsp;
                  <span style="color: #94a3b8; font-weight: 600;">N/A</span> = Non applicable &nbsp;&nbsp;│&nbsp;&nbsp;
                  <span style="color: #64748b; font-weight: 600;">—</span> = Non défini
                </p>
              </td>
            </tr>
          </table>

          <!-- ═══════ CTA ═══════ -->
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px auto 0 auto;">
            <tr>
              <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); border-radius: 10px; padding: 14px 32px; text-align: center;">
                <span style="color: white; font-size: 14px; font-weight: 700; letter-spacing: 0.3px;">
                  Merci de faire le suivi de ces dossiers rapidement
                </span>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    <!-- ═══════ FOOTER ═══════ -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 0 0 16px 16px; padding: 28px 40px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 6px 0; line-height: 1.5;">
            Ce message a été envoyé automatiquement par le système de gestion Rampes Gardex via Microsoft 365.
          </p>
          <p style="color: #475569; font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} Rampes Gardex inc. — Tous droits réservés
          </p>
        </td>
      </tr>
    </table>

  </div>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

/** Formater une cellule de code de production pour l'email HTML */
function fmtCode(code: string): string {
  if (code === '√') return '<span style="font-weight: 700; color: #16a34a; font-size: 16px;">√</span>';
  if (code === 'At.C') return '<span style="background: #bae6fd; color: #0c4a6e; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; white-space: nowrap;">At.C</span>';
  if (code === 'At.Rep') return '<span style="background: #e9d5ff; color: #581c87; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; white-space: nowrap;">At.Rep</span>';
  if (code === 'N/A') return '<span style="color: #94a3b8; font-weight: 600; font-size: 12px;">N/A</span>';
  if (code === '-') return '<span style="color: #cbd5e1;">—</span>';
  return `<span style="color: #64748b; font-size: 12px; font-weight: 600;">${code}</span>`;
}