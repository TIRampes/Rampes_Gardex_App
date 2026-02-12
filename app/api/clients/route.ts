import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TypeClient } from "@prisma/client";

// GET - Liste tous les clients
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      where: { actif: true },
      include: {
        _count: {
          select: { commandes: true },
        },
      },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erreur GET clients:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des clients" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau client
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nom: string = body.nom;
    const type: TypeClient = body.type;
    const adresse: string = body.adresse;
    const ville: string | null = body.ville || null;
    const province: string | null = body.province || null;
    const codePostal: string | null = body.codePostal || null;
    const pays: string | null = body.pays || null;
    const telephone: string = body.telephone;
    const cellulaire: string | null = body.cellulaire || null;
    const fax: string | null = body.fax || null;
    const personne_Contact: string = body.personne_Contact;
    const emails: string[] = body.emails || [];
    const communicationTexto: boolean = body.communicationTexto || false;
    const communicationCourriel: boolean = body.communicationCourriel !== undefined ? body.communicationCourriel : true;
    const communicationTelephone: boolean = body.communicationTelephone || false;
    const commentaires: string | null = body.commentaires || null;

    // Validation
    if (!nom || !type || !adresse || !telephone || !personne_Contact) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (nom, type, adresse, telephone, personne_Contact)" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        nom,
        type,
        adresse,
        ville,
        province,
        codePostal,
        pays,
        telephone,
        cellulaire,
        fax,
        personne_Contact,
        emails,
        communicationTexto,
        communicationCourriel,
        communicationTelephone,
        commentaires,
      },
      include: {
        _count: {
          select: { commandes: true },
        },
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Erreur POST client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }
}