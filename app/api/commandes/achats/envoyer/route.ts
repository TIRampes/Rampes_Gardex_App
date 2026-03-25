import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; // ⚡️ indispensable pour PDFKit

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { fournisseur, commandeNumero, typeAchat } = data;

    if (!fournisseur?.email) {
      return NextResponse.json({ error: "Email fournisseur manquant" }, { status: 400 });
    }

    // Chemins vers polices et logo
    const regularFontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const boldFontPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    const logoPath = path.join(process.cwd(), "public/images/logo-gardex.png");

    if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
      throw new Error("Polices manquantes dans /public/fonts");
    }
    if (!fs.existsSync(logoPath)) {
      throw new Error("Logo manquant dans /public/images");
    }

    // Génération PDF
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      autoFirstPage: false,
      font: regularFontPath, // ⚡️ éviter Helvetica
    });

    doc.registerFont("R", regularFontPath);
    doc.registerFont("B", boldFontPath);

    doc.addPage({ size: "LETTER", margin: 40 });

    // Logo
    doc.image(logoPath, doc.page.width - 150, 20, { width: 120 });

    // Titre
    doc.font("B").fontSize(18).text("BON DE COMMANDE", 40, 50);
    doc.moveDown(2);

    // Infos commande
    doc.font("R").fontSize(12);
    doc.text(`Commande: ${commandeNumero}`);
    doc.text(`Fournisseur: ${fournisseur.nom || ""}`);
    doc.text(`Type d'achat: ${typeAchat || ""}`);
    doc.moveDown();

    // Lignes
    data.lignes?.forEach((l: any, i: number) => {
      doc.text(`${i + 1} - Produit: ${l.produit || ""} | Qté: ${l.quantite || 1}`);
    });

    doc.end();

    // Attendre fin
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);
    });

    // Conversion en base64 pour Graph API
    const pdfBase64 = pdfBuffer.toString("base64");

    // Auth Azure
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AZURE_CLIENT_ID!,
          client_secret: process.env.AZURE_CLIENT_SECRET!,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    );

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    const mailFrom = process.env.AZURE_MAIL_FROM;

    // Envoi mail via Microsoft Graph
    const graphRes = await fetch(`https://graph.microsoft.com/v1.0/users/${mailFrom}/sendMail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: `Bon de commande ${typeAchat} — ${commandeNumero}`,
          body: {
            contentType: "HTML",
            content: `
              <p>Bonjour,</p>
              <p>Veuillez trouver ci-joint le bon de commande <b>#${commandeNumero}</b>.</p>
              <p>Cordialement,<br/>Rampes Gardex</p>
            `,
          },
          toRecipients: [{ emailAddress: { address: fournisseur.email } }],
          attachments: [
            {
              "@odata.type": "#microsoft.graph.fileAttachment",
              name: `Commande_${commandeNumero}.pdf`,
              contentType: "application/pdf",
              contentBytes: pdfBase64,
            },
          ],
        },
      }),
    });

    if (!graphRes.ok) {
      const txt = await graphRes.text();
      throw new Error(`Graph error: ${txt}`);
    }

    return NextResponse.json({ success: true, message: "Email envoyé avec le PDF" });
  } catch (e: any) {
    console.error("ENVOI ERROR", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}