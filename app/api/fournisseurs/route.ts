// app/api/fournisseurs/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actif = searchParams.get("actif");
    const typeAchat = searchParams.get("typeAchat");

    const where: any = {};
    if (actif !== null) {
      where.actif = actif === "true";
    }

    // Filtrer directement par le champ typeAchat du Fournisseur
    if (typeAchat) {
      where.typeAchat = typeAchat;
    }

    const fournisseurs = await prisma.fournisseur.findMany({
      where,
      orderBy: { nom: "asc" },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
        contact: true,
        typeAchat: true,
        formulaireNom: true,    // Nom du fichier formulaire
        formulaireMime: true,   // MIME type
        // formulaireData n'est PAS inclus ici (trop lourd) — on le sert via /api/fournisseurs/[id]/formulaire
      },
    });

    return NextResponse.json(fournisseurs);
  } catch (error) {
    console.error("Erreur GET fournisseurs:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, email, telephone, adresse, contact, notes, typeAchat } = body;

    if (!nom) {
      return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
    }

    const newFournisseur = await prisma.fournisseur.create({
      data: {
        nom,
        email: email || null,
        telephone: telephone || null,
        adresse: adresse || null,
        contact: contact || null,
        notes: notes || null,
        typeAchat: typeAchat || null,
        actif: true,
      },
    });

    return NextResponse.json(newFournisseur, { status: 201 });
  } catch (error) {
    console.error("Erreur POST fournisseur:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}