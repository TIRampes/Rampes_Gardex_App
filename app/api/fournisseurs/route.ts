// app/api/fournisseurs/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Mapping entre les types d'achat (frontend) et les catégories de produits en base
const TYPE_ACHAT_TO_CATEGORIES: Record<string, string[]> = {
  FIBRE: ["Fibre", "FIBRE"],
  LIMONS: ["Limon", "Limons", "LIMONS"],
  VERRES: ["Verre", "Verres", "VERRES"],
  COLONNES: ["Colonne", "Colonnes", "COLONNES"],
  PEINTURE: ["Peinture", "PEINTURE"],
  ATTACHES: ["Attache", "Attaches", "ATTACHES"],
  PLANCHER_ALUMINIUM: ["Plancher aluminium", "Plancher", "PLANCHER_ALUMINIUM"],
  EUROFORGINGS: ["EuroForgings", "EUROFORGINGS"],
  PEINTURE_DJ: ["Peinture DJ", "PEINTURE_DJ"],
  VERRE_LEPAGE: ["Verre Lepage", "VERRE_LEPAGE"],
  STRUCTURE: ["Structure", "STRUCTURE"],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actif = searchParams.get("actif");
    const typeAchat = searchParams.get("typeAchat");

    const where: any = {};
    if (actif !== null) {
      where.actif = actif === "true";
    }

    // Si typeAchat est fourni, filtrer les fournisseurs qui ont des produits de ce type
    if (typeAchat && TYPE_ACHAT_TO_CATEGORIES[typeAchat]) {
      const categories = TYPE_ACHAT_TO_CATEGORIES[typeAchat];
      // Sous-requête: fournisseur doit avoir au moins un produit dans ces catégories
      where.produits = {
        some: {
          produit: {
            categoriePiece: {
              nom: {
                in: categories,
              },
            },
          },
        },
      };
    }

    const fournisseurs = await prisma.fournisseur.findMany({
      where,
      orderBy: {
        nom: "asc",
      },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
      },
    });

    return NextResponse.json(fournisseurs);
  } catch (error) {
    console.error("Erreur lors de la récupération des fournisseurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des fournisseurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, email, telephone, adresse, contact, notes } = body;

    if (!nom) {
      return NextResponse.json(
        { error: "Le nom du fournisseur est obligatoire" },
        { status: 400 }
      );
    }

    const newFournisseur = await prisma.fournisseur.create({
      data: {
        nom,
        email: email || null,
        telephone: telephone || null,
        adresse: adresse || null,
        contact: contact || null,
        notes: notes || null,
        actif: true,
      },
    });

    return NextResponse.json(newFournisseur, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du fournisseur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du fournisseur" },
      { status: 500 }
    );
  }
}