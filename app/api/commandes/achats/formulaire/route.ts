// app/api/commandes/achats/formulaire/route.ts
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; // ⚡️ essentiel pour PDFKit

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const regularFontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const boldFontPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    const logoPath = path.join(process.cwd(), "public/images/logo-gardex.png");

    if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
      throw new Error("Polices manquantes dans /public/fonts");
    }
    if (!fs.existsSync(logoPath)) {
      throw new Error("Logo manquant dans /public/images");
    }

    const chunks: Buffer[] = [];
    
    // ⚡️ Font par défaut définie ici pour éviter Helvetica
    const doc = new PDFDocument({
      autoFirstPage: false,
      font: regularFontPath
    });

    // Enregistrer polices
    doc.registerFont("R", regularFontPath);
    doc.registerFont("B", boldFontPath);

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {});
    doc.on("error", (err) => { throw err; });

    doc.addPage({ size: "LETTER", margin: 40 });
    
    // Logo
    doc.image(logoPath, doc.page.width - 150, 20, { width: 120 });

    // Titre
    doc.font("B").fontSize(18).text("BON DE COMMANDE", 40, 50);
    doc.moveDown(2);

    // Infos commande
    doc.font("R").fontSize(12);
    doc.text(`Commande: ${data.commandeNumero}`);
    doc.text(`Fournisseur: ${data.fournisseur?.nom || ""}`);
    doc.text(`Type d'achat: ${data.typeAchat || ""}`);
    doc.moveDown();

    // Lignes
    data.lignes?.forEach((l: any, i: number) => {
      doc.text(`${i + 1} - Produit: ${l.produit || ""} | Qté: ${l.quantite || 1}`);
    });

    doc.end();

    // ⚡️ Attendre fin
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Commande_${data.commandeNumero}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error("PDF FORMULAIRE ERROR", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}