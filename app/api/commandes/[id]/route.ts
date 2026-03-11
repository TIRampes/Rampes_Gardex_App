import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { commandeSchema, calculatePiedsLineairesTotaux, calculateTempsInstallationAuto } from "../schema";

// Helper: string | Date | null | undefined → Date | null
function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

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
          select: { interventions: true, reprises: true, achats: true, productions: true },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map((c) => [c.cle, c.valeur]));

    return NextResponse.json({
      ...commande,
      config: {
        coutHeureInstallation: parseFloat(configMap.coutHeureInstallation || "160"),
        facteurTempsInstallation: parseFloat(configMap.facteurTempsInstallation || "0.7"),
      },
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

    const existingCommande = await prisma.commande.findUnique({
      where: { id },
      include: { balcons: true, structuresAchat: true },
    });
    if (!existingCommande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const validation = commandeSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Données invalides", details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;

    // Vérifier unicité numéro
    if (data.numero && data.numero !== existingCommande.numero) {
      const dup = await prisma.commande.findUnique({ where: { numero: data.numero } });
      if (dup) return NextResponse.json({ error: "Ce numéro de commande existe déjà" }, { status: 400 });
    }

    // Configurations
    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map((c) => [c.cle, c.valeur]));
    const coutHeure = parseFloat(configMap.coutHeureInstallation || "160");
    const facteurTemps = parseFloat(configMap.facteurTempsInstallation || "0.7");

    // Prix
    const prixVenteMateriaux = data.prixVenteMateriaux ?? Number(existingCommande.prixVenteMateriaux);
    const prixVenteInstallation = data.prixVenteInstallation ?? Number(existingCommande.prixVenteInstallation);
    const prixTotal = prixVenteMateriaux + prixVenteInstallation;

    // Pieds linéaires
    const piedsLineairesRampes = calculatePiedsLineairesTotaux({
      piedsLineairesBarrotin: Number(data.piedsLineairesBarrotin ?? existingCommande.piedsLineairesBarrotin),
      piedsLineairesVerre: Number(data.piedsLineairesVerre ?? existingCommande.piedsLineairesVerre),
      piedsLineairesMur: Number(data.piedsLineairesMur ?? existingCommande.piedsLineairesMur),
      piedsLineairesMainDouble: Number(data.piedsLineairesMainDouble ?? existingCommande.piedsLineairesMainDouble),
      piedsLineairesGardexVision: Number(data.piedsLineairesGardexVision ?? existingCommande.piedsLineairesGardexVision),
      piedsLineairesGardexUrbaine: Number(data.piedsLineairesGardexUrbaine ?? existingCommande.piedsLineairesGardexUrbaine),
      piedsLineairesGardexOptimum: Number(data.piedsLineairesGardexOptimum ?? existingCommande.piedsLineairesGardexOptimum),
    });

    // Temps installation auto
    let tempsInstallationAuto: number = Number(existingCommande.tempsInstallationAuto ?? 0);
    const utiliserCalculAuto = data.utiliserCalculAuto ?? existingCommande.utiliserCalculAuto;
    if (utiliserCalculAuto && Number(prixVenteInstallation) > 0) {
      try {
        const prix = Number(prixVenteInstallation);
        if (!isNaN(prix) && !isNaN(coutHeure) && !isNaN(facteurTemps) && coutHeure > 0) {
          tempsInstallationAuto = calculateTempsInstallationAuto(prix, coutHeure, facteurTemps);
          tempsInstallationAuto = Math.round(tempsInstallationAuto * 2) / 2;
        } else {
          tempsInstallationAuto = 0;
        }
      } catch {
        tempsInstallationAuto = 0;
      }
    }

    // Statut
    const ancienStatut = existingCommande.statut;
    const nouveauStatut = data.statut || ancienStatut;

    // Extraire les sous-objets non-Prisma
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { balcons, structuresAchat, achatsPhase: _ap, installation: _inst, ...rest } = data;

    // Construire uniquement les champs qui ont été fournis (partial update)
    const updateData: Record<string, unknown> = {};

    // Scalaires simples — ne set que si fourni
    if (rest.numero !== undefined) updateData.numero = rest.numero;
    if (rest.clientId !== undefined) updateData.clientId = rest.clientId;
    if (rest.representantId !== undefined) updateData.representantId = rest.representantId || null;
    if (rest.reference !== undefined) updateData.reference = rest.reference || null;
    if (rest.typeCommande !== undefined) updateData.typeCommande = rest.typeCommande;
    if (rest.service !== undefined) updateData.service = rest.service;
    if (rest.statut !== undefined) updateData.statut = rest.statut;
    if (rest.adresse !== undefined) updateData.adresse = rest.adresse;
    if (rest.commentaireAdresse !== undefined) updateData.commentaireAdresse = rest.commentaireAdresse || null;
    if (rest.couleur !== undefined) updateData.couleur = rest.couleur ? String(rest.couleur) : null;
    if (rest.reprise !== undefined) updateData.reprise = rest.reprise;
    if (rest.ancienneCommandeNumero !== undefined) updateData.ancienneCommandeNumero = rest.ancienneCommandeNumero || null;

    // Dates — ne set que si fourni
    if (rest.dateEntree !== undefined) updateData.dateEntree = toDate(rest.dateEntree);
    if (rest.datePrevue !== undefined) updateData.datePrevue = toDate(rest.datePrevue);
    if (rest.dateProduction !== undefined) updateData.dateProduction = toDate(rest.dateProduction);
    if (rest.datePriseMesure !== undefined) updateData.datePriseMesure = toDate(rest.datePriseMesure);
    if (rest.dateLivraison !== undefined) updateData.dateLivraison = toDate(rest.dateLivraison);
    if (rest.semainePrevue !== undefined) updateData.semainePrevue = rest.semainePrevue || null;
    if (rest.mesureDonneeLe !== undefined) updateData.mesureDonneeLe = toDate(rest.mesureDonneeLe);

    // Prix — toujours recalculés
    updateData.prixVenteMateriaux = prixVenteMateriaux;
    updateData.prixVenteInstallation = prixVenteInstallation;
    updateData.prixTotal = prixTotal;
    updateData.tempsInstallationAuto = tempsInstallationAuto;
    updateData.piedsLineairesRampes = piedsLineairesRampes;

    if (rest.utiliserCalculAuto !== undefined) updateData.utiliserCalculAuto = rest.utiliserCalculAuto;

    // Pieds linéaires
    if (rest.piedsLineairesBarrotin !== undefined) updateData.piedsLineairesBarrotin = rest.piedsLineairesBarrotin;
    if (rest.piedsLineairesVerre !== undefined) updateData.piedsLineairesVerre = rest.piedsLineairesVerre;
    if (rest.piedsLineairesMur !== undefined) updateData.piedsLineairesMur = rest.piedsLineairesMur;
    if (rest.piedsLineairesMainDouble !== undefined) updateData.piedsLineairesMainDouble = rest.piedsLineairesMainDouble;
    if (rest.piedsLineairesGardexVision !== undefined) updateData.piedsLineairesGardexVision = rest.piedsLineairesGardexVision;
    if (rest.piedsLineairesGardexUrbaine !== undefined) updateData.piedsLineairesGardexUrbaine = rest.piedsLineairesGardexUrbaine;
    if (rest.piedsLineairesGardexOptimum !== undefined) updateData.piedsLineairesGardexOptimum = rest.piedsLineairesGardexOptimum;
    if (rest.nombrePoteaux !== undefined) updateData.nombrePoteaux = rest.nombrePoteaux;
    if (rest.tempsEstimeInstallation !== undefined) updateData.tempsEstimeInstallation = rest.tempsEstimeInstallation;
    if (rest.piedsCarresFibre !== undefined) updateData.piedsCarresFibre = rest.piedsCarresFibre ?? null;
    if (rest.piedsRampesBarrotin !== undefined) updateData.piedsRampesBarrotin = rest.piedsRampesBarrotin;
    if (rest.piedsRampesVerre !== undefined) updateData.piedsRampesVerre = rest.piedsRampesVerre;
    if (rest.piedsRampesMurIntimite !== undefined) updateData.piedsRampesMurIntimite = rest.piedsRampesMurIntimite;
    if (rest.piedsRampesMainDouble !== undefined) updateData.piedsRampesMainDouble = rest.piedsRampesMainDouble;
    if (rest.piedsRampesGardexVision !== undefined) updateData.piedsRampesGardexVision = rest.piedsRampesGardexVision;
    if (rest.piedsRampesGardexVisionUrbaine !== undefined) updateData.piedsRampesGardexVisionUrbaine = rest.piedsRampesGardexVisionUrbaine;
    if (rest.piedsRampesGardexVisionOptimum !== undefined) updateData.piedsRampesGardexVisionOptimum = rest.piedsRampesGardexVisionOptimum;

    // Commercial
    if (rest.nombreBalcons !== undefined) updateData.nombreBalcons = rest.nombreBalcons ?? null;
    if (rest.nombrePhases !== undefined) updateData.nombrePhases = rest.nombrePhases ?? null;
    if (rest.piedsLineairesEstime !== undefined) updateData.piedsLineairesEstime = rest.piedsLineairesEstime ?? null;
    if (rest.piedsLineairesReels !== undefined) updateData.piedsLineairesReels = rest.piedsLineairesReels ?? null;

    // Production
    if (rest.structure !== undefined) updateData.structure = rest.structure;
    if (rest.mesure !== undefined) updateData.mesure = rest.mesure || null;
    if (rest.plan !== undefined) updateData.plan = rest.plan || null;
    if (rest.envoyeProduction !== undefined) updateData.envoyeProduction = rest.envoyeProduction || null;
    if (rest.productionTerminee !== undefined) updateData.productionTerminee = rest.productionTerminee || null;
    if (rest.termine !== undefined) updateData.termine = rest.termine || null;
    if (rest.statutLivraison !== undefined) updateData.statutLivraison = rest.statutLivraison ? String(rest.statutLivraison) : "N_A";

    // Achats
    if (rest.achatFibre !== undefined) updateData.achatFibre = rest.achatFibre || null;
    if (rest.dateEnvoieFibre !== undefined) updateData.dateEnvoieFibre = toDate(rest.dateEnvoieFibre);
    if (rest.dateReceptionFibre !== undefined) updateData.dateReceptionFibre = toDate(rest.dateReceptionFibre);
    if (rest.quantiteNonRecueFibre !== undefined) updateData.quantiteNonRecueFibre = rest.quantiteNonRecueFibre ?? null;

    if (rest.achatLimons !== undefined) updateData.achatLimons = rest.achatLimons || null;
    if (rest.dateEnvoieLimons !== undefined) updateData.dateEnvoieLimons = toDate(rest.dateEnvoieLimons);
    if (rest.dateReceptionLimons !== undefined) updateData.dateReceptionLimons = toDate(rest.dateReceptionLimons);
    if (rest.quantiteNonRecueLimons !== undefined) updateData.quantiteNonRecueLimons = rest.quantiteNonRecueLimons ?? null;

    if (rest.achatVerres !== undefined) updateData.achatVerres = rest.achatVerres || null;
    if (rest.dateEnvoieVerres !== undefined) updateData.dateEnvoieVerres = toDate(rest.dateEnvoieVerres);
    if (rest.dateReceptionVerre !== undefined) updateData.dateReceptionVerre = toDate(rest.dateReceptionVerre);
    if (rest.quantiteNonRecueVerres !== undefined) updateData.quantiteNonRecueVerres = rest.quantiteNonRecueVerres ?? null;

    if (rest.achatColonnes !== undefined) updateData.achatColonnes = rest.achatColonnes || null;
    if (rest.dateEnvoieColonnes !== undefined) updateData.dateEnvoieColonnes = toDate(rest.dateEnvoieColonnes);
    if (rest.dateReceptionColonnes !== undefined) updateData.dateReceptionColonnes = toDate(rest.dateReceptionColonnes);
    if (rest.quantiteNonRecueColonnes !== undefined) updateData.quantiteNonRecueColonnes = rest.quantiteNonRecueColonnes ?? null;

    if (rest.achatPeinture !== undefined) updateData.achatPeinture = rest.achatPeinture || null;
    if (rest.dateEnvoiePeinture !== undefined) updateData.dateEnvoiePeinture = toDate(rest.dateEnvoiePeinture);
    if (rest.dateReceptionPeinture !== undefined) updateData.dateReceptionPeinture = toDate(rest.dateReceptionPeinture);
    if (rest.quantiteNonRecuePeinture !== undefined) updateData.quantiteNonRecuePeinture = rest.quantiteNonRecuePeinture ?? null;

    if (rest.achatAttaches !== undefined) updateData.achatAttaches = rest.achatAttaches || null;
    if (rest.dateEnvoieAttaches !== undefined) updateData.dateEnvoieAttaches = toDate(rest.dateEnvoieAttaches);
    if (rest.dateReceptionAttaches !== undefined) updateData.dateReceptionAttaches = toDate(rest.dateReceptionAttaches);
    if (rest.quantiteNonRecueAttaches !== undefined) updateData.quantiteNonRecueAttaches = rest.quantiteNonRecueAttaches ?? null;

    if (rest.achatPlancherAluminium !== undefined) updateData.achatPlancherAluminium = rest.achatPlancherAluminium || null;
    if (rest.dateEnvoiePlancherAluminium !== undefined) updateData.dateEnvoiePlancherAluminium = toDate(rest.dateEnvoiePlancherAluminium);
    if (rest.dateReceptionPlancherAluminium !== undefined) updateData.dateReceptionPlancherAluminium = toDate(rest.dateReceptionPlancherAluminium);
    if (rest.quantiteNonRecuePlancherAluminium !== undefined) updateData.quantiteNonRecuePlancherAluminium = rest.quantiteNonRecuePlancherAluminium ?? null;

    // Avertissements
    if (rest.avertissementClient !== undefined) updateData.avertissementClient = rest.avertissementClient || null;
    if (rest.dateAvertissement !== undefined) updateData.dateAvertissement = toDate(rest.dateAvertissement);
    if (rest.avertissementPriseMesure !== undefined) updateData.avertissementPriseMesure = rest.avertissementPriseMesure || null;
    if (rest.dateAvertissementPriseMesure !== undefined) updateData.dateAvertissementPriseMesure = toDate(rest.dateAvertissementPriseMesure);

    // Flags
    if (rest.enProduction !== undefined) updateData.enProduction = rest.enProduction;
    if (rest.clientPresent !== undefined) updateData.clientPresent = rest.clientPresent;
    if (rest.formulaireComplete !== undefined) updateData.formulaireComplete = rest.formulaireComplete;
    if (rest.commentaire !== undefined) updateData.commentaire = rest.commentaire || null;

    // Dates auto statut
    if (nouveauStatut === "COMPLETEE" && ancienStatut !== "COMPLETEE") updateData.dateCompletion = new Date();
    if (nouveauStatut === "ANNULEE" && ancienStatut !== "ANNULEE") updateData.dateAnnulation = new Date();

    // Update commande
    const commande = await prisma.commande.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, nom: true, type: true } },
        representant: { select: { id: true, nom: true } },
        balcons: { orderBy: { numeroPhase: "asc" } },
        structuresAchat: true,
      },
    });

    // Historique statut
    if (ancienStatut !== nouveauStatut) {
      await prisma.historiqueStatut.create({
        data: { commandeId: id, ancienStatut, nouveauStatut, commentaire: body.commentaireStatut || null },
      });
    }

    // Balcons (SEULEMENT les champs existants dans Prisma Balcon)
    if (balcons !== undefined) {
      await prisma.balcon.deleteMany({ where: { commandeId: id } });
      if (balcons && balcons.length > 0) {
        await prisma.balcon.createMany({
          data: balcons.map((b, i) => ({
            commandeId: id,
            nom: b.nom,
            numeroPhase: b.numeroPhase || i + 1,
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

    // Structures d'achat
    if (structuresAchat !== undefined) {
      await prisma.structureAchat.deleteMany({ where: { commandeId: id } });
      if (structuresAchat && structuresAchat.length > 0) {
        await prisma.structureAchat.createMany({
          data: structuresAchat.map((s) => ({
            commandeId: id,
            nom: s.nom,
            statutAchat: s.statutAchat || "A_FAIRE",
            dateEnvoie: toDate(s.dateEnvoie),
            dateReception: toDate(s.dateReception),
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

    const existing = await prisma.commande.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });

    await prisma.commande.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Commande supprimée" });
  } catch (error) {
    console.error("Erreur DELETE commande:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}