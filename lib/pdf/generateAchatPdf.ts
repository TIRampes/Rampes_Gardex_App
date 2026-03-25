import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export async function generateAchatPdf(data: any): Promise<Buffer> {
  const regularFontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
  const boldFontPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
  const logoPath = path.join(process.cwd(), "public/images/logo-gardex.png");

  if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
    throw new Error("Polices manquantes dans /public/fonts");
  }
  if (!fs.existsSync(logoPath)) {
    throw new Error("Logo manquant dans /public/images");
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.registerFont("R", regularFontPath);
    doc.registerFont("B", boldFontPath);

    doc.addPage({ size: "LETTER", margin: 50 });

    // ---------------- HEADER ----------------
    doc.image(logoPath, 50, 40, { width: 120 });
    doc.font("R").fontSize(10).fillColor("black");

    // Infos entreprise
    doc.text("Rampes Gardex", 50, 170);
    doc.text("123, rue Exemple", 50, 185);
    doc.text("Québec, QC, G1A 2B3", 50, 200);
    doc.text("info@rampesgardex.ca | 418-123-4567", 50, 215);

    // Infos fournisseur
    const startX = 350;
    doc.text(`Fournisseur: ${data.fournisseur?.nom || ""}`, startX, 170);
    doc.text(`Email: ${data.fournisseur?.email || ""}`, startX, 185);
    doc.text(`Téléphone: ${data.fournisseur?.telephone || ""}`, startX, 200);

    // ---------------- TITRE ----------------
    doc.font("B").fontSize(20).fillColor("black").text("BON DE COMMANDE", { align: "center", underline: true });
    doc.moveDown(1);
    doc.font("R").fontSize(12);
    doc.text(`Commande #: ${data.commandeNumero}`, { align: "center" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1);

    // ---------------- TABLEAU ----------------
    const tableTop = 300;
    const rowHeight = 20;
    const colWidths = {
      numero: 30,
      description: 240,
      qty: 50,
      pu: 60,
      total: 70,
    };
    const startXTable = 50;

    // Header jaune
    doc.rect(startXTable, tableTop - 5, Object.values(colWidths).reduce((a, b) => a + b, 0), rowHeight).fill("#FFD700");
    doc.fillColor("black").font("B");

    let x = startXTable;
    doc.text("#", x, tableTop, { width: colWidths.numero, align: "left" });
    x += colWidths.numero;
    doc.text("Description", x, tableTop, { width: colWidths.description, align: "left" });
    x += colWidths.description;
    doc.text("Qté", x, tableTop, { width: colWidths.qty, align: "center" });
    x += colWidths.qty;
    doc.text("PU", x, tableTop, { width: colWidths.pu, align: "right" });
    x += colWidths.pu;
    doc.text("Total", x, tableTop, { width: colWidths.total, align: "right" });

    let y = tableTop + rowHeight;
    doc.font("R");

    let grandTotal = 0;

    for (const [index, l] of (data.lignes || []).entries()) {
      const total = (l.quantite || 1) * (l.prix || 0);
      grandTotal += total;

      // Lignes alternées
      const fillColor = index % 2 === 0 ? "#F5F5F5" : "white";
      doc.rect(startXTable, y - 2, Object.values(colWidths).reduce((a, b) => a + b, 0), rowHeight).fill(fillColor);

      // Bordures de la ligne
      doc.rect(startXTable, y - 2, Object.values(colWidths).reduce((a, b) => a + b, 0), rowHeight).stroke("#000000");

      // Contenu
      x = startXTable;
      doc.fillColor("black");
      doc.text(index + 1, x, y, { width: colWidths.numero, align: "left" });
      x += colWidths.numero;
      doc.text(l.produit || "", x, y, { width: colWidths.description, align: "left" });
      x += colWidths.description;
      doc.text(l.quantite || 1, x, y, { width: colWidths.qty, align: "center" });
      x += colWidths.qty;
      doc.text((l.prix || 0).toFixed(2), x, y, { width: colWidths.pu, align: "right" });
      x += colWidths.pu;
      doc.text(total.toFixed(2), x, y, { width: colWidths.total, align: "right" });

      y += rowHeight;
    }

    // Total général sur fond noir
    doc.rect(startXTable + colWidths.numero + colWidths.description + colWidths.qty + colWidths.pu, y + 10, colWidths.total, rowHeight).fill("black");
    doc.fillColor("white").font("B").text(grandTotal.toFixed(2), startXTable + colWidths.numero + colWidths.description + colWidths.qty + colWidths.pu, y + 15, { width: colWidths.total, align: "right" });
    doc.fillColor("black");

    // ---------------- FOOTER ----------------
    const footerY = doc.page.height - 50;
    doc.font("R").fontSize(9);
    doc.text(
      "Rampes Gardex – 123, rue Exemple, Québec, QC | info@rampesgardex.ca | 418-123-4567",
      50,
      footerY,
      { align: "center", width: doc.page.width - 100 }
    );

    doc.end();
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}