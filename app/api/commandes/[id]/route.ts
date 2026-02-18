import { NextResponse ,NextRequest} from "next/server";
import { prisma } from "@/lib/prisma";
import { commandeSchema } from "../schema";

// GET - Récupérer une commande par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const commande = await prisma.commande.findUnique({
      where: { id },
      include: {
        client: true,
        representant: true,
        balcons: { orderBy: { numeroPhase: "asc" } },
        planifications: {
          include: { equipe: true },
          orderBy: { datePlanifiee: "desc" },
          take: 5,
        },
        productions: {
          orderBy: { dateProduction: "desc" },
          take: 5,
        },
        interventions: {
          include: { equipe: true, responsable: true },
          orderBy: { datePrevue: "desc" },
          take: 10,
        },
        reprises: {
          include: { equipe: true },
          orderBy: { dateReprise: "desc" },
        },
        achats: {
          include: { fournisseur: true },
          orderBy: { dateCommande: "desc" },
        },
        historiqueStatuts: {
          orderBy: { dateChangement: "desc" },
          take: 10,
        },
        _count: {
          select: {
            interventions: true,
            reprises: true,
            achats: true,
            productions: true,
          },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    return NextResponse.json(commande);
  } catch (error) {
    console.error("Erreur GET commande:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

// PUT - Mettre à jour une commande
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier que la commande existe
    const existingCommande = await prisma.commande.findUnique({
      where: { id },
      include: { balcons: true },
    });

    if (!existingCommande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    // Validation partielle avec Zod
    const validation = commandeSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Vérifier l'unicité du numéro si modifié
    if (data.numero && data.numero !== existingCommande.numero) {
      const existingNumero = await prisma.commande.findUnique({ where: { numero: data.numero } });
      if (existingNumero) {
        return NextResponse.json({ error: "Ce numéro de commande existe déjà" }, { status: 400 });
      }
    }

    // Calculer le prix total si modifié
    const prixVenteMateriaux = data.prixVenteMateriaux ?? Number(existingCommande.prixVenteMateriaux);
    const prixVenteInstallation = data.prixVenteInstallation ?? Number(existingCommande.prixVenteInstallation);
    const prixTotal = prixVenteMateriaux + prixVenteInstallation;

    // Gérer le changement de statut
    const ancienStatut = existingCommande.statut;
    const nouveauStatut = data.statut || ancienStatut;

    // Extraire les balcons
    const { balcons, ...commandeData } = data;

    // Mettre à jour la commande
    const commande = await prisma.commande.update({
      where: { id },
      data: {
        ...commandeData,
        prixTotal,
        datePrevue: data.datePrevue ? new Date(data.datePrevue) : undefined,
        dateLivraison: data.dateLivraison ? new Date(data.dateLivraison) : undefined,
        dateProduction: data.dateProduction ? new Date(data.dateProduction) : undefined,
        datePriseMesure: data.datePriseMesure ? new Date(data.datePriseMesure) : undefined,
        mesureDonneeLe: data.mesureDonneeLe ? new Date(data.mesureDonneeLe) : undefined,
        dateReceptionFibre: data.dateReceptionFibre ? new Date(data.dateReceptionFibre) : undefined,
        dateReceptionLimons: data.dateReceptionLimons ? new Date(data.dateReceptionLimons) : undefined,
        dateReceptionVerre: data.dateReceptionVerre ? new Date(data.dateReceptionVerre) : undefined,
        dateReceptionColonnes: data.dateReceptionColonnes ? new Date(data.dateReceptionColonnes) : undefined,
        dateReceptionPeinture: data.dateReceptionPeinture ? new Date(data.dateReceptionPeinture) : undefined,
        dateReceptionAttaches: data.dateReceptionAttaches ? new Date(data.dateReceptionAttaches) : undefined,
        dateReceptionPlancherAluminium: data.dateReceptionPlancherAluminium ? new Date(data.dateReceptionPlancherAluminium) : undefined,
        dateCompletion: nouveauStatut === "COMPLETEE" && ancienStatut !== "COMPLETEE" ? new Date() : undefined,
        dateAnnulation: nouveauStatut === "ANNULEE" && ancienStatut !== "ANNULEE" ? new Date() : undefined,
      },
      include: {
        client: { select: { id: true, nom: true, type: true } },
        representant: { select: { id: true, nom: true } },
        balcons: true,
      },
    });

    // Créer une entrée dans l'historique si le statut a changé
    if (ancienStatut !== nouveauStatut) {
      await prisma.historiqueStatut.create({
        data: {
          commandeId: id,
          ancienStatut,
          nouveauStatut,
          commentaire: body.commentaireStatut || null,
        },
      });
    }

    // Gérer les balcons si fournis
    if (balcons !== undefined) {
      // Supprimer les anciens balcons
      await prisma.balcon.deleteMany({ where: { commandeId: id } });
      
      // Créer les nouveaux balcons
      if (balcons && balcons.length > 0) {
        await prisma.balcon.createMany({
          data: balcons.map((b, index) => ({
            commandeId: id,
            nom: b.nom,
            numeroPhase: b.numeroPhase || index + 1,
            piedsLineaires: b.piedsLineaires || 0,
            poteaux: b.poteaux || 0,
            coutBalcon: b.coutBalcon || 0,
            prixTotal: b.prixTotal || 0,
            produit: b.produit || false,
            installationTerminee: b.installationTerminee || false,
            reprise: b.reprise || false,
            notes: b.notes || null,
          })),
        });
      }
    }

    return NextResponse.json(commande);
  } catch (error) {
    console.error("Erreur PUT commande:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

// DELETE - Supprimer une commande
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingCommande = await prisma.commande.findUnique({ where: { id } });
    if (!existingCommande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    // Supprimer la commande (les relations seront supprimées en cascade grâce au schema)
    await prisma.commande.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Commande supprimée" });
  } catch (error) {
    console.error("Erreur DELETE commande:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}