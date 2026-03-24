// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: app/api/achats/envoyer/route.ts                 ║
// ║  NOUVEAU — envoie le formulaire par email via MS Graph     ║
// ╚══════════════════════════════════════════════════════════╝

import { NextRequest, NextResponse } from 'next/server';

async function getGraphToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Variables Azure manquantes (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)');
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) throw new Error('Échec obtention token Azure');
  const data = await res.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { typeAchat, fournisseur, formValues, lignes, commandeNumero, phaseName } = body;

    if (!fournisseur?.email) {
      return NextResponse.json({ error: 'Email fournisseur manquant' }, { status: 400 });
    }

    // 1. Générer le PDF en appelant notre propre API
    const pdfRes = await fetch(new URL('/api/commandes/achats/formulaire', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ typeAchat, fournisseur, formValues, lignes, commandeNumero, phaseName }),
    });

    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 });
    }

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    const pdfBase64 = pdfBuffer.toString('base64');

    // 2. Envoyer via Microsoft Graph
    const token = await getGraphToken();
    const mailFrom = process.env.AZURE_MAIL_FROM;

    if (!mailFrom) {
      return NextResponse.json({ error: 'AZURE_MAIL_FROM non configuré' }, { status: 500 });
    }

    const fileName = `Commande_${typeAchat}_${commandeNumero}${phaseName ? `_${phaseName}` : ''}.pdf`;

    // Construire le body HTML du courriel
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #1a2332;">Bon de commande — Rampes Gardex</h2>
        <p>Bonjour,</p>
        <p>Veuillez trouver ci-joint notre bon de commande pour: <strong>${typeAchat}</strong></p>
        <table style="margin: 16px 0; border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0; color: #666;">Commande:</td><td style="font-weight: bold;">${commandeNumero}</td></tr>
          ${phaseName ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Phase:</td><td>${phaseName}</td></tr>` : ''}
          ${formValues.dateCommande || formValues.date ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Date:</td><td>${formValues.dateCommande || formValues.date}</td></tr>` : ''}
          ${formValues.dateLivraison ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Livraison souhaitée:</td><td>${formValues.dateLivraison}</td></tr>` : ''}
        </table>
        <p>Merci de confirmer la réception et les délais de livraison.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Rampes Gardex Inc.<br/>2200 rue Albert-Dion, Lévis, QC G7A 5M9<br/>Tél: 418-831-1330</p>
      </div>
    `;

    const emailPayload = {
      message: {
        subject: `Bon de commande ${typeAchat} — ${commandeNumero}${phaseName ? ` (${phaseName})` : ''} — Rampes Gardex`,
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients: [{ emailAddress: { address: fournisseur.email } }],
        attachments: [
          {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: fileName,
            contentType: 'application/pdf',
            contentBytes: pdfBase64,
          },
        ],
      },
      saveToSentItems: true,
    };

    const graphRes = await fetch(`https://graph.microsoft.com/v1.0/users/${mailFrom}/sendMail`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!graphRes.ok) {
      const err = await graphRes.text();
      console.error('Graph sendMail error:', err);
      return NextResponse.json({ error: 'Erreur envoi email Microsoft Graph' }, { status: 500 });
    }

    return NextResponse.json({ message: `Email envoyé à ${fournisseur.email}` });
  } catch (error: any) {
    console.error('Erreur envoi email:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}