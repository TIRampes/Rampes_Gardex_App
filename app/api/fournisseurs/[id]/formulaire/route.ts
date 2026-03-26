// app/api/fournisseurs/[id]/formulaire/route.ts
// Sert le fichier formulaire (PDF, DOCX, etc.) stocké en BD pour un fournisseur
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id },
      select: {
        formulaireNom: true,
        formulaireMime: true,
        formulaireData: true,
      },
    });

    if (!fournisseur || !fournisseur.formulaireData) {
      return NextResponse.json(
        { error: "Aucun formulaire disponible pour ce fournisseur" },
        { status: 404 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", fournisseur.formulaireMime || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${fournisseur.formulaireNom || "formulaire"}"`
    );
    headers.set("Content-Length", String(fournisseur.formulaireData.length));

    return new NextResponse(fournisseur.formulaireData, { status: 200, headers });
  } catch (error) {
    console.error("Erreur téléchargement formulaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}