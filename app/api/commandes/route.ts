import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { commandeSchema, calculateDates, calculatePiedsLineairesTotaux, calculateTempsInstallationAuto } from "./schema";

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

// GET - Liste toutes les commandes avec filtres et stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statut = searchParams.get("statut");
    const type = searchParams.get("type");
    const service = searchParams.get("service");
    const clientId = searchParams.get("clientId");
    const representantId = searchParams.get("representantId");

    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { reference: { contains: search } },
        { client: { nom: { contains: search } } },
        { adresse: { contains: search } },
      ];
    }
    if (statut) where.statut = statut;
    if (type) where.typeCommande = type;
    if (service) where.service = service;
    if (clientId) where.clientId = clientId;
    if (representantId) where.representantId = representantId;

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        client: { select: { id: true, nom: true, type: true, telephone: true, personne_Contact: true } },
        representant: { select: { id: true, nom: true } },
        balcons: { orderBy: { numeroPhase: "asc" } },
        structuresAchat: true,
        _count: { select: { interventions: true, reprises: true, achats: true } },
      },
      orderBy: { dateEntree: "desc" },
    });

    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map((c) => [c.cle, c.valeur]));

    const allCommandes = await prisma.commande.findMany({
      select: {
        statut: true, typeCommande: true, service: true, enProduction: true,
        datePrevue: true, representantId: true, clientId: true, commentaire: true, reprise: true,
      },
    });

    const parRepresentant: Record<string, number> = {};
    allCommandes.forEach((c) => {
      if (c.representantId) parRepresentant[c.representantId] = (parRepresentant[c.representantId] || 0) + 1;
    });
    const parClient: Record<string, number> = {};
    allCommandes.forEach((c) => {
      if (c.clientId) parClient[c.clientId] = (parClient[c.clientId] || 0) + 1;
    });

    const stats = {
      total: allCommandes.length,
      parStatut: {
        ACTIVE: allCommandes.filter((c) => c.statut === "ACTIVE").length,
        EN_ATTENTE: allCommandes.filter((c) => c.statut === "EN_ATTENTE").length,
        COMPLETEE: allCommandes.filter((c) => c.statut === "COMPLETEE").length,
        ANNULEE: allCommandes.filter((c) => c.statut === "ANNULEE").length,
      },
      parType: {
        STANDARD: allCommandes.filter((c) => c.typeCommande === "STANDARD").length,
        COMMERCIAL: allCommandes.filter((c) => c.typeCommande === "COMMERCIAL").length,
        MULTI_PHASE: allCommandes.filter((c) => c.typeCommande === "MULTI_PHASE").length,
        MULTIPLAN: allCommandes.filter((c) => c.typeCommande === "MULTIPLAN").length,
      },
      parService: {
        INSTALLATION: allCommandes.filter((c) => c.service === "INSTALLATION").length,
        LIVRAISON: allCommandes.filter((c) => c.service === "LIVRAISON").length,
        CUEILLETTE: allCommandes.filter((c) => c.service === "CUEILLETTE").length,
        TRANSPORT: allCommandes.filter((c) => c.service === "TRANSPORT").length,
      },
      parRepresentant,
      parClient,
      enProduction: allCommandes.filter((c) => c.enProduction).length,
      enRetard: allCommandes.filter((c) => c.datePrevue && new Date(c.datePrevue) < new Date() && c.statut === "ACTIVE").length,
      actives: allCommandes.filter((c) => c.statut === "ACTIVE").length,
      completees: allCommandes.filter((c) => c.statut === "COMPLETEE").length,
      avecCommentaires: allCommandes.filter((c) => c.commentaire).length,
      reprises: allCommandes.filter((c) => c.reprise).length,
    };

    return NextResponse.json({
      commandes,
      stats,
      config: {
        coutHeureInstallation: parseFloat(configMap.coutHeureInstallation || "160"),
        facteurTempsInstallation: parseFloat(configMap.facteurTempsInstallation || "0.7"),
      },
    });
  } catch (error) {
    console.error("Erreur GET commandes:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

// POST - Créer une nouvelle commande
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = commandeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Données invalides", details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) return NextResponse.json({ error: "Client non trouvé" }, { status: 400 });

    const existingNumero = await prisma.commande.findUnique({ where: { numero: data.numero } });
    if (existingNumero) return NextResponse.json({ error: "Ce numéro de commande existe déjà" }, { status: 400 });

    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map((c) => [c.cle, c.valeur]));
    const coutHeure = parseFloat(configMap.coutHeureInstallation || "160");
    const facteurTemps = parseFloat(configMap.facteurTempsInstallation || "0.7");

    const prixTotal = (data.prixVenteMateriaux || 0) + (data.prixVenteInstallation || 0);
    const piedsLineairesRampes = calculatePiedsLineairesTotaux({
      piedsLineairesBarrotin: data.piedsLineairesBarrotin || 0,
      piedsLineairesVerre: data.piedsLineairesVerre || 0,
      piedsLineairesMur: data.piedsLineairesMur || 0,
      piedsLineairesMainDouble: data.piedsLineairesMainDouble || 0,
      piedsLineairesGardexVision: data.piedsLineairesGardexVision || 0,
      piedsLineairesGardexUrbaine: data.piedsLineairesGardexUrbaine || 0,
      piedsLineairesGardexOptimum: data.piedsLineairesGardexOptimum || 0,
    });

    let tempsInstallationAuto = 0;
    if (data.utiliserCalculAuto && data.prixVenteInstallation > 0) {
      tempsInstallationAuto = calculateTempsInstallationAuto(data.prixVenteInstallation, coutHeure, facteurTemps);
    }

    let datePrevue = toDate(data.datePrevue);
    let dateProduction = toDate(data.dateProduction);
    let semainePrevue = data.semainePrevue;
    if (dateProduction && !datePrevue) {
      const calc = calculateDates(dateProduction);
      datePrevue = calc.datePrevue;
      dateProduction = calc.dateProduction;
      semainePrevue = calc.semainePrevue;
    }

    const { balcons, structuresAchat, achatsPhase, ...rest } = data;

    const commande = await prisma.commande.create({
      data: {
        numero: rest.numero,
        clientId: rest.clientId,
        representantId: rest.representantId || null,
        reference: rest.reference || null,
        typeCommande: rest.typeCommande,
        service: rest.service,
        statut: rest.statut,
        adresse: rest.adresse,
        commentaireAdresse: rest.commentaireAdresse || null,
        couleur: rest.couleur || null,
        couleurPersonnalisee: rest.couleur === "AUTRE" ? rest.couleurPersonnalisee : null,
        reprise: rest.reprise,
        ancienneCommandeNumero: rest.ancienneCommandeNumero || null,
        dateEntree: toDate(rest.dateEntree) || new Date(),
        datePrevue,
        dateProduction,
        datePriseMesure: toDate(rest.datePriseMesure),
        dateLivraison: toDate(rest.dateLivraison),
        semainePrevue: semainePrevue || null,
        prixVenteMateriaux: rest.prixVenteMateriaux,
        prixVenteInstallation: rest.prixVenteInstallation,
        prixTotal,
        tempsInstallationAuto,
        utiliserCalculAuto: rest.utiliserCalculAuto,
        piedsLineairesBarrotin: rest.piedsLineairesBarrotin,
        piedsLineairesVerre: rest.piedsLineairesVerre,
        piedsLineairesMur: rest.piedsLineairesMur,
        piedsLineairesMainDouble: rest.piedsLineairesMainDouble,
        piedsLineairesGardexVision: rest.piedsLineairesGardexVision,
        piedsLineairesGardexUrbaine: rest.piedsLineairesGardexUrbaine,
        piedsLineairesGardexOptimum: rest.piedsLineairesGardexOptimum,
        piedsLineairesRampes,
        nombrePoteaux: rest.nombrePoteaux,
        tempsEstimeInstallation: rest.tempsEstimeInstallation,
        piedsCarresFibre: rest.piedsCarresFibre ?? null,
        piedsRampesBarrotin: rest.piedsRampesBarrotin,
        piedsRampesVerre: rest.piedsRampesVerre,
        piedsRampesMurIntimite: rest.piedsRampesMurIntimite,
        piedsRampesMainDouble: rest.piedsRampesMainDouble,
        piedsRampesGardexVision: rest.piedsRampesGardexVision,
        piedsRampesGardexVisionUrbaine: rest.piedsRampesGardexVisionUrbaine,
        piedsRampesGardexVisionOptimum: rest.piedsRampesGardexVisionOptimum,
        nombreBalcons: rest.nombreBalcons ?? null,
        nombrePhases: rest.nombrePhases ?? null,
        piedsLineairesEstime: rest.piedsLineairesEstime ?? null,
        piedsLineairesReels: rest.piedsLineairesReels ?? null,
        structure: rest.structure,
        
        // CORRECTION DES NOMS DE COLONNES (Basé sur ton prismasCHEMA.txt)
        mesure: rest.mesure || null,
        mesureDonneeLe: toDate(rest.mesureDonneeLe),
        plan: rest.plan || null,
        planApprobationEnvoyeLe: toDate(rest.planApprobationEnvoyeLe),
        envoyeProduction: rest.envoyeProduction || null,
        productionTerminee: rest.productionTerminee || null,
        termine: rest.termine || null,
        statutLivraison: rest.statutLivraison || "N_A",
        installation: rest.installation || null,

        achatFibre: rest.achatFibre || null,
        dateEnvoieFibre: toDate(rest.dateEnvoieFibre),
        dateReceptionFibre: toDate(rest.dateReceptionFibre),
        quantiteNonRecueFibre: rest.quantiteNonRecueFibre ?? null,
        achatLimons: rest.achatLimons || null,
        dateEnvoieLimons: toDate(rest.dateEnvoieLimons),
        dateReceptionLimons: toDate(rest.dateReceptionLimons),
        quantiteNonRecueLimons: rest.quantiteNonRecueLimons ?? null,
        achatVerres: rest.achatVerres || null,
        dateEnvoieVerres: toDate(rest.dateEnvoieVerres),
        dateReceptionVerre: toDate(rest.dateReceptionVerre),
        quantiteNonRecueVerres: rest.quantiteNonRecueVerres ?? null,
        achatColonnes: rest.achatColonnes || null,
        dateEnvoieColonnes: toDate(rest.dateEnvoieColonnes),
        dateReceptionColonnes: toDate(rest.dateReceptionColonnes),
        quantiteNonRecueColonnes: rest.quantiteNonRecueColonnes ?? null,
        achatPeinture: rest.achatPeinture || null,
        dateEnvoiePeinture: toDate(rest.dateEnvoiePeinture),
        dateReceptionPeinture: toDate(rest.dateReceptionPeinture),
        quantiteNonRecuePeinture: rest.quantiteNonRecuePeinture ?? null,
        achatAttaches: rest.achatAttaches || null,
        dateEnvoieAttaches: toDate(rest.dateEnvoieAttaches),
        dateReceptionAttaches: toDate(rest.dateReceptionAttaches),
        quantiteNonRecueAttaches: rest.quantiteNonRecueAttaches ?? null,
        achatPlancherAluminium: rest.achatPlancherAluminium || null,
        dateEnvoiePlancherAluminium: toDate(rest.dateEnvoiePlancherAluminium),
        dateReceptionPlancherAluminium: toDate(rest.dateReceptionPlancherAluminium),
        quantiteNonRecuePlancherAluminium: rest.quantiteNonRecuePlancherAluminium ?? null,
        avertissementClient: rest.avertissementClient || null,
        dateAvertissement: toDate(rest.dateAvertissement),
        avertissementPriseMesure: rest.avertissementPriseMesure || null,
        dateAvertissementPriseMesure: toDate(rest.dateAvertissementPriseMesure),
        enProduction: rest.enProduction,
        clientPresent: rest.clientPresent,
        formulaireComplete: rest.formulaireComplete,
        commentaire: rest.commentaire || null,

        // CORRECTION DU NOM DE LA RELATION : balcons (au pluriel)
        balcons: balcons && balcons.length > 0 ? {
          create: balcons.map((b, i) => ({
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
            datePrevue: toDate(b.datePrevue),
            prixVenteInstallation: b.prixVenteInstallation,
            mesure: b.mesure || null,
            plan: b.plan || null,
            planApprobationEnvoyeLe: toDate(b.planApprobationEnvoyeLe),
            envoyeProduction: b.envoyeProduction || null,
            termine: b.termine || null,
            installation: b.installation || null,
          })),
        } : undefined,

        structuresAchat: structuresAchat && structuresAchat.length > 0 ? {
          create: structuresAchat.map((s) => ({
            nom: s.nom,
            statutAchat: s.statutAchat || "A_FAIRE",
            dateEnvoie: toDate(s.dateEnvoie),
            dateReception: toDate(s.dateReception),
            quantiteNonRecue: s.quantiteNonRecue || null,
          })),
        } : undefined,

        achatPhases: achatsPhase && achatsPhase.length > 0 ? {
          create: achatsPhase.map((a) => ({
            phaseNumero: a.phaseNumero,
            typeAchat: a.typeAchat,
            statut: a.statut || "A_FAIRE",
            dateEnvoie: toDate(a.dateEnvoie),
            dateReception: toDate(a.dateReception),
            quantiteNonRecue: a.quantiteNonRecue ?? null,
            codeProduit: a.codeProduit || null,
            description: a.description || null,
            quantite: a.quantite ?? null,
            prixUnitaire: a.prixUnitaire ?? null,
            couleur: a.couleur || null,
            epaisseur: a.epaisseur || null,
            typeVerre: a.typeVerre || null,
            longueur: a.longueur ?? null,
            hauteur: a.hauteur ?? null,
            notes: a.notes || null,
          })),
        } : undefined,
      },
      include: {
        client: { select: { id: true, nom: true, type: true } },
        representant: { select: { id: true, nom: true } },
        balcons: { orderBy: { numeroPhase: "asc" } },
        structuresAchat: true,
        achatPhases: true,
      },
    });

    await prisma.historiqueStatut.create({
      data: {
        commandeId: commande.id,
        ancienStatut: "ACTIVE",
        nouveauStatut: commande.statut,
        commentaire: "Création de la commande",
      },
    });

    return NextResponse.json(commande, { status: 201 });
  } catch (error) {
    console.error("Erreur POST commande:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}