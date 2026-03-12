import { sendMailViaGraph } from '@/lib/microsoft-graph';
import { prisma } from '@/lib/prisma';
import type { DelaiLivraison, RuptureStock } from '@/app/api/achats/schema';
import { calculerDateLivraison } from '@/app/api/achats/schema';

// ╔══════════════════════════════════════════════════════╗
// ║   EMAIL DÉLAIS DE LIVRAISON — Microsoft Graph         ║
// ╚══════════════════════════════════════════════════════╝

export async function envoyerDelaisParCourriel(
  delais: DelaiLivraison[],
  ruptures: RuptureStock[],
  debutConstruction: string
): Promise<{ envoyes: number; erreurs: string[] }> {
  // Récupérer tous les utilisateurs actifs
  const users = await prisma.user.findMany({
    where: { actif: true },
    select: { email: true, nom: true, prenom: true },
  });

  if (users.length === 0) {
    return { envoyes: 0, erreurs: ['Aucun utilisateur actif trouvé'] };
  }

  const html = genererEmailDelais(delais, ruptures, debutConstruction);
  const subject = `📋 Délais de livraison — Rampes Gardex | ${new Date().toLocaleDateString('fr-CA')}`;

  let envoyes = 0;
  const erreurs: string[] = [];

  for (const user of users) {
    try {
      const result = await sendMailViaGraph({
        to: user.email,
        toName: `${user.prenom} ${user.nom}`,
        subject,
        htmlBody: html,
        importance: 'normal',
      });
      if (result.success) envoyes++;
      else erreurs.push(`${user.email}: ${result.error}`);
    } catch (e: any) {
      erreurs.push(`${user.email}: ${e.message}`);
    }
  }

  return { envoyes, erreurs };
}

function genererEmailDelais(
  delais: DelaiLivraison[],
  ruptures: RuptureStock[],
  debutConstruction: string
): string {
  const date = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const lignesDelais = delais.map((d, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-weight:600;font-size:14px;color:#1e293b;">${d.secteur}</td>
      <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;font-size:16px;color:#334155;">${d.delaiSemaines}</td>
      <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;color:#64748b;font-weight:600;">SEMAINES</td>
      <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:500;font-size:14px;color:#2563eb;">${calculerDateLivraison(d.delaiSemaines, debutConstruction)}</td>
    </tr>`).join('');

  const lignesRuptures = ruptures.length > 0 ? ruptures.map((r) => `
    <tr>
      <td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;font-weight:600;">${r.piece}</td>
      <td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;text-align:center;">${r.couleur || '—'}</td>
      <td style="padding:10px 20px;border-bottom:1px solid #e2e8f0;text-align:center;">
        <span style="background:#f1f5f9;padding:4px 12px;border-radius:6px;font-size:13px;">${r.dateReception ? new Date(r.dateReception).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
      </td>
    </tr>`).join('') : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Calibri,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:720px;margin:0 auto;padding:24px 16px;">
    <!-- Header -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr><td style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;"><tr>
          <td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1e293b;font-weight:900;font-size:20px;padding:10px 24px;border-radius:12px;letter-spacing:1.5px;">RAMPES GARDEX</td>
        </tr></table>
        <h1 style="color:white;font-size:22px;margin:20px 0 4px;font-weight:700;">📋 Délais de livraison</h1>
        <p style="color:#94a3b8;font-size:13px;margin:0;">${date}</p>
      </td></tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr><td style="background:white;padding:32px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        <p style="font-size:15px;color:#334155;margin:0 0 6px;">Bonjour,</p>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px;">Voici la liste actuelle des délais de livraison par secteur${debutConstruction ? ` (début construction: ${new Date(debutConstruction).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}.</p>

        <!-- Tableau délais -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
          <tr>
            <th style="background:#f1f5f9;padding:12px 20px;text-align:left;font-size:14px;color:#334155;border-bottom:2px solid #cbd5e1;">Secteur</th>
            <th style="background:#f1f5f9;padding:12px 20px;text-align:center;font-size:14px;color:#334155;border-bottom:2px solid #cbd5e1;" colspan="2">Délai</th>
            <th style="background:#f1f5f9;padding:12px 20px;text-align:center;font-size:14px;color:#2563eb;border-bottom:2px solid #cbd5e1;">Date de livraison</th>
          </tr>
          ${lignesDelais}
        </table>

        ${ruptures.length > 0 ? `
        <h2 style="font-size:18px;font-weight:700;text-align:center;text-decoration:underline;margin:28px 0 16px;color:#1e293b;">Rupture de stock</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
          <tr>
            <th style="background:#fef2f2;padding:10px 20px;text-align:left;font-size:13px;color:#991b1b;border-bottom:1px solid #fecaca;">Pièce</th>
            <th style="background:#fef2f2;padding:10px 20px;text-align:center;font-size:13px;color:#991b1b;border-bottom:1px solid #fecaca;">Couleur</th>
            <th style="background:#fef2f2;padding:10px 20px;text-align:center;font-size:13px;color:#991b1b;border-bottom:1px solid #fecaca;">Date de réception</th>
          </tr>
          ${lignesRuptures}
        </table>` : ''}
      </td></tr>
    </table>

    <!-- Footer -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr><td style="background:#1e293b;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Ce message a été envoyé par le système Rampes Gardex via Microsoft 365.</p>
        <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} Rampes Gardex inc. — Tous droits réservés</p>
      </td></tr>
    </table>
  </div>
</body></html>`;
}