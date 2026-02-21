import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { commandeSchema, calculatePiedsLineairesTotaux, calculateTempsInstallationAuto } from "../schema";

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
        structuresAchat: true,
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

    // Récupérer les configurations
    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map(c => [c.cle, c.valeur]));

    return NextResponse.json({
      ...commande,
      config: {
        coutHeureInstallation: parseFloat(configMap.coutHeureInstallation || "160"),
        facteurTempsInstallation: parseFloat(configMap.facteurTempsInstallation || "0.7"),
      }
    });
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
      include: { 
        balcons: true,
        structuresAchat: true 
      },
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

    // Récupérer les configurations
    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map(c => [c.cle, c.valeur]));
    const coutHeure = parseFloat(configMap.coutHeureInstallation || "160");
    const facteurTemps = parseFloat(configMap.facteurTempsInstallation || "0.7");

    // Calculer le prix total si modifié
    const prixVenteMateriaux = data.prixVenteMateriaux ?? Number(existingCommande.prixVenteMateriaux);
    const prixVenteInstallation = data.prixVenteInstallation ?? Number(existingCommande.prixVenteInstallation);
    const prixTotal = prixVenteMateriaux + prixVenteInstallation;

    // Calculer les pieds linéaires totaux
    const piedsLineairesBarrotin = data.piedsLineairesBarrotin ?? existingCommande.piedsLineairesBarrotin;
    const piedsLineairesVerre = data.piedsLineairesVerre ?? existingCommande.piedsLineairesVerre;
    const piedsLineairesMur = data.piedsLineairesMur ?? existingCommande.piedsLineairesMur;
    const piedsLineairesMainDouble = data.piedsLineairesMainDouble ?? existingCommande.piedsLineairesMainDouble;
    const piedsLineairesGardexVision = data.piedsLineairesGardexVision ?? existingCommande.piedsLineairesGardexVision;
    const piedsLineairesGardexUrbaine = data.piedsLineairesGardexUrbaine ?? existingCommande.piedsLineairesGardexUrbaine;
    const piedsLineairesGardexOptimum = data.piedsLineairesGardexOptimum ?? existingCommande.piedsLineairesGardexOptimum;

    const piedsLineairesRampes = calculatePiedsLineairesTotaux({
      piedsLineairesBarrotin: Number(piedsLineairesBarrotin),
      piedsLineairesVerre: Number(piedsLineairesVerre),
      piedsLineairesMur: Number(piedsLineairesMur),
      piedsLineairesMainDouble: Number(piedsLineairesMainDouble),
      piedsLineairesGardexVision: Number(piedsLineairesGardexVision),
      piedsLineairesGardexUrbaine: Number(piedsLineairesGardexUrbaine),
      piedsLineairesGardexOptimum: Number(piedsLineairesGardexOptimum),
    });

   // Calculer le temps d'installation auto si demandé
let tempsInstallationAuto: number = Number(existingCommande.tempsInstallationAuto ?? 0);
const utiliserCalculAuto = data.utiliserCalculAuto ?? existingCommande.utiliserCalculAuto;

if (utiliserCalculAuto && Number(prixVenteInstallation ?? 0) > 0) {
  try {
    const prix = Number(prixVenteInstallation ?? 0);
    const coutH = Number(coutHeure ?? 160); // valeur par défaut
    const facteur = Number(facteurTemps ?? 0.7); // valeur par défaut

    // Ne lancer le calcul que si tout est valide
    if (!isNaN(prix) && !isNaN(coutH) && !isNaN(facteur) && coutH > 0) {
      tempsInstallationAuto = calculateTempsInstallationAuto(prix, coutH, facteur);
      tempsInstallationAuto = Math.round(tempsInstallationAuto * 2) / 2; // arrondi au demi-heure
    } else {
      tempsInstallationAuto = 0;
    }
  } catch (error) {
    console.error("Erreur lors du calcul du temps d'installation auto:", error);
    tempsInstallationAuto = 0;
  }
}


    // Gérer le changement de statut
    const ancienStatut = existingCommande.statut;
    const nouveauStatut = data.statut || ancienStatut;

    // Extraire les balcons et structures
    const { balcons, structuresAchat, ...commandeData } = data;

    // Mettre à jour la commande
    const commande = await prisma.commande.update({
      where: { id },
      data: {
        ...commandeData,
        prixTotal,
        piedsLineairesRampes,
        tempsInstallationAuto,
        dateEntree: data.dateEntree ? new Date(data.dateEntree) : undefined,
        datePrevue: data.datePrevue ? new Date(data.datePrevue) : undefined,
        dateLivraison: data.dateLivraison ? new Date(data.dateLivraison) : undefined,
        dateProduction: data.dateProduction ? new Date(data.dateProduction) : undefined,
        datePriseMesure: data.datePriseMesure ? new Date(data.datePriseMesure) : undefined,
        mesureDonneeLe: data.mesureDonneeLe ? new Date(data.mesureDonneeLe) : undefined,
        dateReceptionFibre: data.dateReceptionFibre ? new Date(data.dateReceptionFibre) : undefined,
        dateEnvoieFibre: data.dateEnvoieFibre ? new Date(data.dateEnvoieFibre) : undefined,
        dateReceptionLimons: data.dateReceptionLimons ? new Date(data.dateReceptionLimons) : undefined,
        dateEnvoieLimons: data.dateEnvoieLimons ? new Date(data.dateEnvoieLimons) : undefined,
        dateReceptionVerre: data.dateReceptionVerre ? new Date(data.dateReceptionVerre) : undefined,
        dateEnvoieVerres: data.dateEnvoieVerres ? new Date(data.dateEnvoieVerres) : undefined,
        dateReceptionColonnes: data.dateReceptionColonnes ? new Date(data.dateReceptionColonnes) : undefined,
        dateEnvoieColonnes: data.dateEnvoieColonnes ? new Date(data.dateEnvoieColonnes) : undefined,
        dateReceptionPeinture: data.dateReceptionPeinture ? new Date(data.dateReceptionPeinture) : undefined,
        dateEnvoiePeinture: data.dateEnvoiePeinture ? new Date(data.dateEnvoiePeinture) : undefined,
        dateReceptionAttaches: data.dateReceptionAttaches ? new Date(data.dateReceptionAttaches) : undefined,
        dateEnvoieAttaches: data.dateEnvoieAttaches ? new Date(data.dateEnvoieAttaches) : undefined,
        dateReceptionPlancherAluminium: data.dateReceptionPlancherAluminium ? new Date(data.dateReceptionPlancherAluminium) : undefined,
        dateEnvoiePlancherAluminium: data.dateEnvoiePlancherAluminium ? new Date(data.dateEnvoiePlancherAluminium) : undefined,
        dateCompletion: nouveauStatut === "COMPLETEE" && ancienStatut !== "COMPLETEE" ? new Date() : undefined,
        dateAnnulation: nouveauStatut === "ANNULEE" && ancienStatut !== "ANNULEE" ? new Date() : undefined,
      },
      include: {
        client: { select: { id: true, nom: true, type: true } },
        representant: { select: { id: true, nom: true } },
        balcons: true,
        structuresAchat: true,
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

    // Gérer les structures d'achat si fournies
    if (structuresAchat !== undefined) {
      // Supprimer les anciennes structures
      await prisma.structureAchat.deleteMany({ where: { commandeId: id } });
      
      // Créer les nouvelles structures
      if (structuresAchat && structuresAchat.length > 0) {
        await prisma.structureAchat.createMany({
          data: structuresAchat.map(s => ({
            commandeId: id,
            nom: s.nom,
            statutAchat: s.statutAchat || "A_FAIRE",
            dateEnvoie: s.dateEnvoie ? new Date(s.dateEnvoie) : null,
            dateReception: s.dateReception ? new Date(s.dateReception) : null,
            quantiteNonRecue: s.quantiteNonRecue || null,
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