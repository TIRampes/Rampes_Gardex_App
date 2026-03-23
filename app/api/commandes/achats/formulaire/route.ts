// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: app/api/achats/formulaire/route.ts              ║
// ║  NOUVEAU — génère un PDF du formulaire d'achat            ║
// ║  npm install pdfkit                                       ║
// ╚══════════════════════════════════════════════════════════╝

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { typeAchat, fournisseur, formValues, lignes, commandeNumero, phaseName } = body;

    // Import dynamique pour éviter les problèmes de bundle
    const PDFDocument = (await import('pdfkit')).default;

    // Créer le PDF
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // En-tête Rampes Gardex
    doc.fontSize(10).text('Rampes Gardex Inc.', { align: 'left' });
    doc.text('2200 rue Albert-Dion, Lévis, QC G7A 5M9');
    doc.text('Tél: 418-831-1330');
    doc.moveDown(0.5);

    // Ligne séparatrice
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.5);

    // Titre
    doc.fontSize(16).font('Helvetica-Bold').text(`BON DE COMMANDE — ${typeAchat}`, { align: 'center' });
    doc.moveDown(0.3);

    // Fournisseur
    doc.fontSize(10).font('Helvetica-Bold').text(`À : ${fournisseur.nom}`);
    doc.font('Helvetica');
    if (fournisseur.adresse) doc.text(fournisseur.adresse);
    if (fournisseur.email) doc.text(`Email: ${fournisseur.email}`);
    if (fournisseur.telephone) doc.text(`Tél: ${fournisseur.telephone}`);
    doc.moveDown(0.5);

    // Info commande
    doc.font('Helvetica-Bold').text(`Commande: ${commandeNumero}${phaseName ? ` — ${phaseName}` : ''}`);
    doc.font('Helvetica');
    doc.moveDown(0.5);

    // Champs du formulaire
    const fieldLabels: Record<string, string> = {
      dateCommande: 'Date de commande', noCommande: 'No commande', commandePar: 'Commandé par',
      dateLivraison: 'Date livraison prévue', po: 'P.O.', date: 'Date', reference: 'Référence',
      epaisseur: 'Épaisseur', typeVerre: 'Type de verre', couleur: 'Couleur',
      hauteurTotale: 'Hauteur totale', courseTotale: 'Course totale', typeLimon: 'Type de limon',
      nbMarches: 'Nombre de marches', nbEnsembles: "Nombre d'ensembles", nbLimons: 'Nombre de limons',
      typeMarche: 'Type de marche', lipe: 'Lipe', contreMarche: 'Contre-marche', giron: 'Giron',
      soumission: 'Soumission #', dateRequise: 'Date requise', dateRecu: 'Date reçu',
      muretFibre: 'Muret en fibre', marches: 'Marches', quantite: 'Quantité',
      dimensions: 'Dimensions', options: 'Options', notes: 'Notes',
    };

    // Afficher les champs 2 par ligne
    const entries = Object.entries(formValues).filter(([_, v]) => v !== '' && v !== 0 && v != null);
    for (let i = 0; i < entries.length; i += 2) {
      const left = entries[i];
      const right = entries[i + 1];
      const y = doc.y;

      doc.font('Helvetica-Bold').fontSize(9).text(`${fieldLabels[left[0]] || left[0]}:`, 50, y, { width: 130 });
      doc.font('Helvetica').text(String(left[1]), 185, y, { width: 120 });

      if (right) {
        doc.font('Helvetica-Bold').text(`${fieldLabels[right[0]] || right[0]}:`, 320, y, { width: 130 });
        doc.font('Helvetica').text(String(right[1]), 455, y, { width: 107 });
      }
      doc.moveDown(0.3);
    }

    // Lignes du tableau
    if (lignes && lignes.length > 0 && lignes.some((l: any) => Object.values(l).some(v => v))) {
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica-Bold').text('Détails:', 50);
      doc.moveDown(0.3);

      // Déterminer les colonnes à partir des données
      const cols = Object.keys(lignes[0] || {}).filter(k => k);
      if (cols.length > 0) {
        const colWidth = Math.min(120, (512 / cols.length));

        // En-tête tableau
        const headerY = doc.y;
        doc.fontSize(8).font('Helvetica-Bold');
        cols.forEach((col, ci) => {
          const colLabels: Record<string, string> = {
            quantite: 'Qté', longueur: 'Longueur', hauteur: 'Hauteur', commentaire: 'Commentaire',
            description: 'Description', dimension: 'Dimension', code: 'Code', prixUnit: 'Prix unit.',
            type: 'Type', taille: 'Taille', argile: 'Argile', blanc: 'Blanc', brun: 'Brun', noir: 'Noir', noirFonte: 'N. fonte',
          };
          doc.text(colLabels[col] || col, 50 + ci * colWidth, headerY, { width: colWidth - 5 });
        });
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(0.2);

        // Données
        doc.font('Helvetica').fontSize(9);
        lignes.forEach((ligne: any) => {
          if (!Object.values(ligne).some(v => v)) return;
          const rowY = doc.y;
          cols.forEach((col, ci) => {
            doc.text(String(ligne[col] || ''), 50 + ci * colWidth, rowY, { width: colWidth - 5 });
          });
          doc.moveDown(0.3);
        });
      }
    }

    // Pied de page
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(8).text(`Généré le ${new Date().toLocaleDateString('fr-CA')} — Rampes Gardex`, { align: 'center' });

    doc.end();

    // Attendre que le PDF soit complet
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(Uint8Array.from(pdfBuffer), {
  status: 200,
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="Commande_${typeAchat}_${commandeNumero}.pdf"`,
  },
});
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 });
  }
}