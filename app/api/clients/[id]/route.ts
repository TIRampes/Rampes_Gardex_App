import { NextResponse,NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TypeClient } from "@prisma/client";

// GET - Récupérer un client par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { commandes: true },
        },
        commandes: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            numero: true,
            statut: true,
            dateEntree: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erreur GET client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du client" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier si le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

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

    const client = await prisma.client.update({
      where: { id },
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

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erreur PUT client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du client" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un client (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    // Soft delete - marquer comme inactif
    await prisma.client.update({
      where: { id },
      data: { actif: false },
    });

    return NextResponse.json({ success: true, message: "Client supprimé" });
  } catch (error) {
    console.error("Erreur DELETE client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du client" },
      { status: 500 }
    );
  }
}