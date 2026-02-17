import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TypeClient,ZoneResidentielle } from "@prisma/client"; // Importez ZoneResidentielle
import { clientSchema } from "./schema";

// GET - Liste tous les clients (avec possibilité de filtrer par zone)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const zone = searchParams.get('zone') as ZoneResidentielle | null;
    
    const where: any = { actif: true };
    
    if (type) {
      where.type = type;
    }
    
    if (zone) {
      where.zoneResidentielle = zone;
    }

    const clients = await prisma.client.findMany({
      where,
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nom: string = body.nom;
    const type: TypeClient = body.type;
    const zoneResidentielle: ZoneResidentielle | null = body.zoneResidentielle || null;
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

    // Validation spécifique pour les clients résidentiels
    if (type === "RESIDENTIEL") {
      if (!zoneResidentielle) {
        return NextResponse.json(
          { error: "La zone résidentielle est obligatoire pour les clients résidentiels" },
          { status: 400 }
        );
      }
      // Vérifier que la zone est valide
      if (!Object.values(ZoneResidentielle).includes(zoneResidentielle)) {
        return NextResponse.json(
          { error: "Zone résidentielle invalide. Doit être RIVE_NORD ou RIVE_SUD" },
          { status: 400 }
        );
      }
    } else {
      // Si ce n'est pas un résidentiel, s'assurer que zoneResidentielle est null
      if (zoneResidentielle) {
        return NextResponse.json(
          { error: "La zone résidentielle ne peut être spécifiée que pour les clients résidentiels" },
          { status: 400 }
        );
      }
    }

    // Validation des données avec le schéma existant
    const validation = clientSchema.safeParse({
      nom,
      type,
      zoneResidentielle, // Ajoutez ceci si votre schéma le supporte
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
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (nom, type, adresse, telephone, personne_Contact)" },
        { status: 400 }
      );
    }
    
    // CREATION DU CLIENT
    const client = await prisma.client.create({
      data: {
        nom,
        type,
        zoneResidentielle, // Ajout du nouveau champ
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