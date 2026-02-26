import { NextResponse,NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TypeClient, ZoneResidentielle } from "@prisma/client";

// fonction pour récupérer un client par ID, avec ses commandes récentes et le nombre total de commandes
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: { 
        _count: { select: { commandes: true } }, 
        commandes: { 
          take: 10, 
          orderBy: { createdAt: "desc" }, 
          select: { id: true, numero: true, statut: true, dateEntree: true } 
        } 
      },
    });
    if (!client) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    return NextResponse.json(client);
  } catch (error) {
    console.error("Erreur GET client:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

// PUT - Mise à jour complète d'un client
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

    const type = body.type as TypeClient;
    const zoneResidentielle = body.zoneResidentielle as ZoneResidentielle | null;

    // Validation pour les clients résidentiels
    if (type === "RESIDENTIEL") {
      if (!zoneResidentielle) {
        return NextResponse.json(
          { error: "La zone résidentielle est obligatoire pour les clients résidentiels" },
          { status: 400 }
        );
      }
      if (!Object.values(ZoneResidentielle).includes(zoneResidentielle)) {
        return NextResponse.json(
          { error: "Zone résidentielle invalide" },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        nom: body.nom?.trim(),
        type: type,
        zoneResidentielle: zoneResidentielle, // Ajout du nouveau champ
        adresse: body.adresse?.trim(),
        ville: body.ville?.trim() || null,
        province: body.province?.trim() || null,
        codePostal: body.codePostal?.trim() || null,
        pays: body.pays?.trim() || null,
        telephone: body.telephone?.trim(),
        cellulaire: body.cellulaire?.trim() || null,
        fax: body.fax?.trim() || null,
        personne_Contact: body.personne_Contact?.trim(),
        emails: Array.isArray(body.emails) ? body.emails.filter((e: string) => e?.trim()) : [],
        communicationTexto: Boolean(body.communicationTexto),
        communicationCourriel: body.communicationCourriel !== false,
        communicationTelephone: Boolean(body.communicationTelephone),
        commentaires: body.commentaires?.trim() || null,
      },
      include: { _count: { select: { commandes: true } } },
    });
    return NextResponse.json(client);
  } catch (error) {
    console.error("Erreur PUT client:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

// DELETE - Suppression logique d'un client
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // 1. Vérifier si le client existe avec toutes ses relations
    const existingClient = await prisma.client.findUnique({ 
      where: { id },
      include: { 
        _count: { 
          select: { 
            commandes: true,
            reprises: true 
          } 
        },
        commandes: {
          take: 5,
          select: {
            id: true,
            numero: true,
            statut: true
          }
        },
        reprises: {
          take: 5,
          select: {
            id: true,
            typeReprise: true,
            statut: true
          }
        }
      }
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client non trouvé" }, 
        { status: 404 }
      );
    }

    // 2. Vérifier les commandes et reprises
    const commandesCount = existingClient._count?.commandes || 0;
    const reprisesCount = existingClient._count?.reprises || 0;
    
    if (commandesCount > 0 || reprisesCount > 0) {
      const problemes = [];
      
      if (commandesCount > 0) {
        problemes.push(`${commandesCount} commande(s)`);
      }
      if (reprisesCount > 0) {
        problemes.push(`${reprisesCount} reprise(s)`);
      }

      return NextResponse.json(
        { 
          error: `Impossible de supprimer ce client car il est lié à ${problemes.join(" et ")}`,
          details: {
            commandes: {
              count: commandesCount,
              liste: existingClient.commandes
            },
            reprises: {
              count: reprisesCount,
              liste: existingClient.reprises
            },
            message: "Veuillez d'abord traiter ces éléments avant de supprimer le client."
          }
        }, 
        { status: 409 }
      );
    }

    // 3. Suppression logique
    await prisma.client.update({ 
      where: { id }, 
      data: { 
        actif: false,
        updatedAt: new Date()
      } 
    });

    return NextResponse.json({ 
      success: true,
      message: "Client supprimé avec succès" 
    });

  } catch (error) {
    console.error("Erreur DELETE client:", error);
    
    // Gestion améliorée des erreurs
    if (error instanceof Error) {
      // Détecter les erreurs de contrainte de clé étrangère
      if (error.message.includes("Foreign key constraint") || 
          error.message.includes("restrict") || 
          error.message.includes("constraint")) {
        return NextResponse.json(
          { 
            error: "Impossible de supprimer ce client car il est référencé par d'autres enregistrements",
            details: "Le client est lié à des commandes ou des reprises dans le système."
          }, 
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Erreur lors de la suppression du client",
          details: error.message 
        }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, 
      { status: 500 }
    );
  }
}
// PATCH - Mise à jour partielle (ex: zone résidentielle)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const client = await prisma.client.update({
      where: { id },
      data: { zoneResidentielle: body.zoneResidentielle }
    });
    
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}