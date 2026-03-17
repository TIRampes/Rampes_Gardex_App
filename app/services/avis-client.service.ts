// services/avis-client.service.ts
import { sendMailViaGraph } from '@/lib/microsoft-graph';

const SERVICE_LABELS: Record<string, string> = {
  INSTALLATION: 'installation de vos rampes',
  LIVRAISON: 'livraison de votre commande',
  CUEILLETTE: 'cueillette prévue',
  TRANSPORT: 'transport de matériaux',
  MESURE: 'prise de mesures',
};

function genererMessage(service: string, date: string, adresse: string, numero: string, heureDebut?: string | null) {
  const label = SERVICE_LABELS[service] || 'intervention';
  const dateFr = new Date(date).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const heureStr = heureDebut ? ` à partir de ${heureDebut}` : '';

  const sujet = `Rampes Gardex — Avis ${
    service === 'INSTALLATION' ? "d'installation" :
    service === 'LIVRAISON' ? 'de livraison' :
    service === 'MESURE' ? 'de mesure' : "d'intervention"
  } #${numero}`;

  const corps = `Bonjour,

Nous vous informons que votre ${label} est prévue pour le ${dateFr}${heureStr} à l'adresse suivante :

📍 ${adresse}

${service === 'INSTALLATION' ? "Notre équipe d'installateurs sera sur place pour procéder à l'installation de vos rampes. Veuillez vous assurer que l'accès aux balcons est dégagé." : ''}
${service === 'LIVRAISON' ? "Notre livreur se présentera à l'adresse indiquée. Veuillez vous assurer qu'une personne soit présente pour réceptionner le matériel." : ''}
${service === 'MESURE' ? "Notre mesureur se présentera pour prendre les mesures nécessaires à la fabrication de vos rampes." : ''}
${service === 'CUEILLETTE' ? "Notre équipe passera récupérer le matériel à l'adresse indiquée." : ''}

Commande #${numero}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
Rampes Gardex inc.`;

  return { sujet, corps };
}

function genererEmailHtml(service: string, date: string, adresse: string, numero: string, heureDebut?: string | null) {
  const msg = genererMessage(service, date, adresse, numero, heureDebut);
  return `<!DOCTYPE html><html><body style="font-family:Calibri,sans-serif;margin:0;padding:0;background:#f1f5f9;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
<table width="100%" style="border-collapse:collapse;">
<tr>
<td style="background:#1e293b;border-radius:12px 12px 0 0;padding:24px;text-align:center;">
<span style="background:#fbbf24;color:#1e293b;font-weight:900;font-size:18px;padding:8px 20px;border-radius:8px;">RAMPES GARDEX</span>
<h2 style="color:white;margin:16px 0 0;font-size:18px;">${msg.sujet}</h2>
</td>
</tr>
<tr>
<td style="background:white;padding:28px;border:1px solid #e2e8f0;">
<p style="white-space:pre-line;font-size:14px;color:#334155;line-height:1.6;">${msg.corps}</p>
</td>
</tr>
<tr>
<td style="background:#1e293b;border-radius:0 0 12px 12px;padding:16px;text-align:center;">
<p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} Rampes Gardex inc.</p>
</td>
</tr>
</table>
</div></body></html>`;
}

function genererSmsTexte(service: string, date: string, numero: string) {
  const label = SERVICE_LABELS[service] || 'intervention';
  const dateFr = new Date(date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
  return `Rampes Gardex: Votre ${label} #${numero} est prévue le ${dateFr}. Contactez-nous pour toute question.`;
}

export async function envoyerAvisClient(opts: {
  email: string | null;
  telephone: string | null;
  clientNom: string;
  service: string;
  date: string;
  adresse: string;
  numero: string;
  heureDebut?: string | null;
}): Promise<{ email: boolean; sms: boolean; erreurs: string[] }> {
  const erreurs: string[] = [];
  let emailOk = false, smsOk = false;

  // EMAIL via Microsoft Graph
  if (opts.email) {
    try {
      const html = genererEmailHtml(opts.service, opts.date, opts.adresse, opts.numero, opts.heureDebut);
      const msg = genererMessage(opts.service, opts.date, opts.adresse, opts.numero, opts.heureDebut);
      const result = await sendMailViaGraph({ to: opts.email, toName: opts.clientNom, subject: msg.sujet, htmlBody: html, importance: 'normal' });
      emailOk = result.success;
      if (!result.success) erreurs.push(`Email: ${result.error}`);
    } catch (e: any) { erreurs.push(`Email: ${e.message}`); }
  } else { erreurs.push('Aucun email client'); }

  // SMS via Twilio
  if (opts.telephone) {
    try {
      const text = genererSmsTexte(opts.service, opts.date, opts.numero);
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;
      if (!sid || !token || !from) throw new Error('Twilio non configuré');

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: opts.telephone, From: from, Body: text }),
      });

      smsOk = res.ok;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        erreurs.push(`SMS: ${err.message || res.statusText}`);
      }
    } catch (e: any) { erreurs.push(`SMS: ${e.message}`); }
  } else { erreurs.push('Aucun téléphone client'); }

  return { email: emailOk, sms: smsOk, erreurs };
}