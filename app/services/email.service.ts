// ╔══════════════════════════════════════════════════════════════╗
// ║   SERVICE EMAIL — Resend (Rampes Gardex)                    ║
// ╚══════════════════════════════════════════════════════════════╝

import { Resend } from "resend";
import type { CommandeAttente, Representant } from "@/app/types/attentes";
import { CODES_DISPLAY, SERVICE_COLORS } from "@/app/api/attentes/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "planification@rampesgardex.com";
const FROM_NAME = process.env.RESEND_FROM_NAME ?? "Rampes Gardex — Planification";
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "planification@rampesgardex.com";
const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL ?? "";

// ══════════════════════════════════════════
// ENVOI EMAIL INDIVIDUEL
// ══════════════════════════════════════════

export interface EnvoiResult {
  success: boolean;
  messageId: string | null;
  error: string | null;
  representantId: string;
  representantEmail: string;
  nbCommandes: number;
}

/**
 * Envoie un email de rappel des attentes à un représentant via Resend.
 */
export async function envoyerAttentesParEmail(
  representant: Representant,
  commandes: CommandeAttente[],
  notesSupplementaires?: string,
  type: "INDIVIDUEL" | "GROUPÉ" | "AUTOMATIQUE" = "INDIVIDUEL"
): Promise<EnvoiResult> {
  if (commandes.length === 0) {
    return {
      success: false,
      messageId: null,
      error: "Aucune commande en attente",
      representantId: representant.id,
      representantEmail: representant.email,
      nbCommandes: 0,
    };
  }

  try {
    const html = genererHtmlEmail(representant, commandes, notesSupplementaires, type);
    const subject = genererSujet(commandes.length, type);

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [representant.email],
      replyTo: REPLY_TO,
      subject,
      html,
      tags: [
        { name: "type", value: type.toLowerCase() },
        { name: "representant", value: representant.initiales },
        { name: "nb_commandes", value: String(commandes.length) },
      ],
    });

    if (error) {
      console.error("[Resend Error]", error);
      return {
        success: false,
        messageId: null,
        error: error.message,
        representantId: representant.id,
        representantEmail: representant.email,
        nbCommandes: commandes.length,
      };
    }

    return {
      success: true,
      messageId: data?.id ?? null,
      error: null,
      representantId: representant.id,
      representantEmail: representant.email,
      nbCommandes: commandes.length,
    };
  } catch (err) {
    console.error("[Email Service]", err);
    return {
      success: false,
      messageId: null,
      error: err instanceof Error ? err.message : "Erreur inconnue",
      representantId: representant.id,
      representantEmail: representant.email,
      nbCommandes: commandes.length,
    };
  }
}

// ══════════════════════════════════════════
// GÉNÉRATION HTML
// ══════════════════════════════════════════

function genererSujet(nbCommandes: number, type: string): string {
  const dateStr = new Date().toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
  if (type === "AUTOMATIQUE") {
    return `[Rappel hebdomadaire] ${nbCommandes} commande(s) en attente — ${dateStr}`;
  }
  return `${nbCommandes} commande(s) en attente de suivi — Rampes Gardex`;
}

function getCodeSymbole(code: string | null): string {
  return CODES_DISPLAY[code ?? ""]?.symbole ?? "—";
}

function getCodeColor(code: string | null): string {
  const info = CODES_DISPLAY[code ?? ""];
  if (!info) return "#94a3b8";
  if (info.bg.includes("emerald")) return "#10b981";
  if (info.bg.includes("sky")) return "#0ea5e9";
  if (info.bg.includes("amber")) return "#f59e0b";
  if (info.bg.includes("slate-2")) return "#94a3b8";
  return "#64748b";
}

function genererHtmlEmail(
  representant: Representant,
  commandes: CommandeAttente[],
  notes?: string,
  type?: string
): string {
  const dateStr = new Date().toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const commandesHtml = commandes
    .map(
      (cmd) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:12px 16px;font-weight:700;font-family:monospace;font-size:14px;">${cmd.numero}</td>
      <td style="padding:12px 16px;">
        <strong style="display:block;">${cmd.clientNom}</strong>
        <span style="color:#64748b;font-size:12px;">${cmd.adresse}</span>
        ${cmd.clientTelephone ? `<br/><span style="color:#64748b;font-size:12px;">📞 ${cmd.clientTelephone}</span>` : ""}
      </td>
      <td style="padding:12px 8px;text-align:center;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;background:${getCodeColor(cmd.mesure)}20;color:${getCodeColor(cmd.mesure)};">
          ${getCodeSymbole(cmd.mesure)}
        </span>
      </td>
      <td style="padding:12px 8px;text-align:center;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;background:${getCodeColor(cmd.plan)}20;color:${getCodeColor(cmd.plan)};">
          ${getCodeSymbole(cmd.plan)}
        </span>
      </td>
      <td style="padding:12px 8px;text-align:center;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;background:${getCodeColor(cmd.envoyeProduction)}20;color:${getCodeColor(cmd.envoyeProduction)};">
          ${getCodeSymbole(cmd.envoyeProduction)}
        </span>
      </td>
      <td style="padding:12px 8px;text-align:center;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;background:${getCodeColor(cmd.productionTerminee)}20;color:${getCodeColor(cmd.productionTerminee)};">
          ${getCodeSymbole(cmd.productionTerminee)}
        </span>
      </td>
      <td style="padding:12px 16px;text-align:center;font-size:13px;">
        <strong>${cmd.piedsLineairesRampes}</strong> pi
      </td>
      <td style="padding:12px 16px;font-size:12px;color:#64748b;max-width:200px;">
        ${cmd.notes ? cmd.notes.split("\n").slice(0, 2).join("<br/>") : "—"}
      </td>
    </tr>`
    )
    .join("");

  const totalPieds = commandes.reduce((a, c) => a + c.piedsLineairesRampes, 0);
  const typeLabel = type === "AUTOMATIQUE" ? "Rappel automatique hebdomadaire" : "Rappel de suivi";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:900px;margin:0 auto;padding:24px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:16px 16px 0 0;padding:32px;color:white;">
      ${COMPANY_LOGO_URL ? `<img src="${COMPANY_LOGO_URL}" alt="Rampes Gardex" style="height:40px;margin-bottom:16px;"/>` : ""}
      <h1 style="margin:0;font-size:24px;font-weight:800;">Rampes Gardex</h1>
      <p style="margin:4px 0 0;opacity:0.8;font-size:14px;">${typeLabel} — ${dateStr}</p>
    </div>

    <!-- Corps -->
    <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">Bonjour <strong>${representant.prenom} ${representant.nom}</strong>,</p>
      <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
        Vous avez actuellement <strong style="color:#0ea5e9;font-size:18px;">${commandes.length}</strong> commande(s) en attente nécessitant un suivi.
        Merci de prendre les actions requises dans les meilleurs délais.
      </p>

      ${notes ? `
      <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#92400e;"><strong>📝 Note:</strong> ${notes}</p>
      </div>` : ""}

      <!-- Résumé -->
      <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;background:#eff6ff;border-radius:8px;padding:12px 16px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#3b82f6;font-weight:600;">COMMANDES</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#1e40af;">${commandes.length}</p>
        </div>
        <div style="flex:1;min-width:120px;background:#f0fdf4;border-radius:8px;padding:12px 16px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#16a34a;font-weight:600;">PIEDS LINÉAIRES</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#15803d;">${totalPieds}</p>
        </div>
      </div>

      <!-- Tableau -->
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;" cellpadding="0" cellspacing="0">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;"># Projet</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Client</th>
              <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Mes.</th>
              <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Plan</th>
              <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Env.P</th>
              <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Prod.T</th>
              <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Pi.lin</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Notes</th>
            </tr>
          </thead>
          <tbody>${commandesHtml}</tbody>
          <tfoot>
            <tr style="background:#f8fafc;font-weight:700;">
              <td colspan="6" style="padding:12px 16px;text-align:right;font-size:13px;color:#475569;">Total:</td>
              <td style="padding:12px 16px;text-align:center;font-size:14px;color:#1e293b;">${totalPieds} pi</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Légende -->
    <div style="background:#f8fafc;padding:16px 32px;border:1px solid #e2e8f0;border-top:none;font-size:12px;color:#64748b;">
      <strong>Légende:</strong>
      √ = Complété &nbsp;|&nbsp;
      At.C = Attente client &nbsp;|&nbsp;
      At.Rep = Attente représentant &nbsp;|&nbsp;
      N/A = Non applicable &nbsp;|&nbsp;
      P = Partiel &nbsp;|&nbsp;
      B/O = Back order
    </div>

    <!-- Footer -->
    <div style="background:#1e293b;border-radius:0 0 16px 16px;padding:24px 32px;color:white;text-align:center;">
      <p style="margin:0;font-size:13px;opacity:0.8;">
        Cet email a été envoyé automatiquement par le système de gestion Rampes Gardex.
      </p>
      <p style="margin:8px 0 0;font-size:12px;opacity:0.5;">
        Merci de ne pas répondre à cet email. Pour toute question, contactez le bureau de planification.
      </p>
    </div>
  </div>
</body>
</html>`;
}