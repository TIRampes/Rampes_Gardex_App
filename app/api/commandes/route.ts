import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { commandeSchema, calculateDates, calculatePiedsLineairesTotaux, calculateTempsInstallationAuto } from "./schema";

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

    // Construire le filtre
    const where: Record<string, unknown> = {};
    
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

    // Récupérer les commandes avec toutes les relations nécessaires
    const commandes = await prisma.commande.findMany({
      where,
      include: {
        client: {
          select: { id: true, nom: true, type: true, telephone: true, personne_Contact: true },
        },
        representant: {
          select: { id: true, nom: true },
        },
        balcons: true,
        structuresAchat: true,
        _count: {
          select: { 
            interventions: true, 
            reprises: true,
            achats: true 
          },
        },
      },
      orderBy: { dateEntree: "desc" },
    });

    // Récupérer les configurations
    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map(c => [c.cle, c.valeur]));

    // Calculer les statistiques détaillées
    const allCommandes = await prisma.commande.findMany({
      select: { 
        statut: true, 
        typeCommande: true, 
        service: true, 
        enProduction: true, 
        datePrevue: true,
        representantId: true,
        clientId: true,
        commentaire: true,
        reprise: true,
      },
    });

    // Compter par représentant
    const parRepresentant: Record<string, number> = {};
    allCommandes.forEach(c => {
      if (c.representantId) {
        parRepresentant[c.representantId] = (parRepresentant[c.representantId] || 0) + 1;
      }
    });

    // Compter par client
    const parClient: Record<string, number> = {};
    allCommandes.forEach(c => {
      if (c.clientId) {
        parClient[c.clientId] = (parClient[c.clientId] || 0) + 1;
      }
    });

    const stats = {
      total: allCommandes.length,
      parStatut: {
        ACTIVE: allCommandes.filter(c => c.statut === "ACTIVE").length,
        EN_ATTENTE: allCommandes.filter(c => c.statut === "EN_ATTENTE").length,
        COMPLETEE: allCommandes.filter(c => c.statut === "COMPLETEE").length,
        ANNULEE: allCommandes.filter(c => c.statut === "ANNULEE").length,
      },
      parType: {
        STANDARD: allCommandes.filter(c => c.typeCommande === "STANDARD").length,
        COMMERCIAL: allCommandes.filter(c => c.typeCommande === "COMMERCIAL").length,
        MULTI_PHASE: allCommandes.filter(c => c.typeCommande === "MULTI_PHASE").length,
        MULTIPLAN: allCommandes.filter(c => c.typeCommande === "MULTIPLAN").length,
      },
      parService: {
        INSTALLATION: allCommandes.filter(c => c.service === "INSTALLATION").length,
        LIVRAISON: allCommandes.filter(c => c.service === "LIVRAISON").length,
        CUEILLETTE: allCommandes.filter(c => c.service === "CUEILLETTE").length,
        TRANSPORT: allCommandes.filter(c => c.service === "TRANSPORT").length,
      },
      parRepresentant,
      parClient,
      enProduction: allCommandes.filter(c => c.enProduction).length,
      enRetard: allCommandes.filter(c => c.datePrevue && new Date(c.datePrevue) < new Date() && c.statut === "ACTIVE").length,
      actives: allCommandes.filter(c => c.statut === "ACTIVE").length,
      completees: allCommandes.filter(c => c.statut === "COMPLETEE").length,
      avecCommentaires: allCommandes.filter(c => c.commentaire).length,
      reprises: allCommandes.filter(c => c.reprise).length,
    };

    // Ajouter les configurations à la réponse
    return NextResponse.json({ 
      commandes, 
      stats,
      config: {
        coutHeureInstallation: parseFloat(configMap.coutHeureInstallation || "160"),
        facteurTempsInstallation: parseFloat(configMap.facteurTempsInstallation || "0.7"),
      }
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
    
    // Validation avec Zod
    const validation = commandeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 400 });
    }

    // Vérifier l'unicité du numéro
    const existingNumero = await prisma.commande.findUnique({ where: { numero: data.numero } });
    if (existingNumero) {
      return NextResponse.json({ error: "Ce numéro de commande existe déjà" }, { status: 400 });
    }

    // Récupérer les configurations
    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map(c => [c.cle, c.valeur]));
    const coutHeure = parseFloat(configMap.coutHeureInstallation || "160");
    const facteurTemps = parseFloat(configMap.facteurTempsInstallation || "0.7");

    // Calculer le prix total
    const prixTotal = (data.prixVenteMateriaux || 0) + (data.prixVenteInstallation || 0);

    // Calculer les pieds linéaires totaux avec facteurs
    const piedsLineairesRampes = calculatePiedsLineairesTotaux({
      piedsLineairesBarrotin: data.piedsLineairesBarrotin || 0,
      piedsLineairesVerre: data.piedsLineairesVerre || 0,
      piedsLineairesMur: data.piedsLineairesMur || 0,
      piedsLineairesMainDouble: data.piedsLineairesMainDouble || 0,
      piedsLineairesGardexVision: data.piedsLineairesGardexVision || 0,
      piedsLineairesGardexUrbaine: data.piedsLineairesGardexUrbaine || 0,
      piedsLineairesGardexOptimum: data.piedsLineairesGardexOptimum || 0,
    });

    // Calculer le temps d'installation auto si demandé
    let tempsInstallationAuto = 0;
    if (data.utiliserCalculAuto && data.prixVenteInstallation > 0) {
      tempsInstallationAuto = calculateTempsInstallationAuto(
        data.prixVenteInstallation,
        coutHeure,
        facteurTemps
      );
    }

    // Calculer les dates en fonction des achats (à améliorer avec les délais fournisseurs)
    let datePrevue = data.datePrevue ? new Date(data.datePrevue) : null;
    let dateProduction = data.dateProduction ? new Date(data.dateProduction) : null;
    let semainePrevue = data.semainePrevue;

    if (data.dateProduction && !datePrevue) {
      const calculated = calculateDates(new Date(data.dateProduction));
      datePrevue = calculated.datePrevue;
      dateProduction = calculated.dateProduction;
      semainePrevue = calculated.semainePrevue;
    }

    // Extraire les balcons et structures du body
    const { balcons, structuresAchat, ...commandeData } = data;

    // Créer la commande
    const commande = await prisma.commande.create({
      data: {
        ...commandeData,
        prixTotal,
        piedsLineairesRampes,
        tempsInstallationAuto,
        datePrevue,
        dateProduction,
        semainePrevue,
        dateEntree: data.dateEntree ? new Date(data.dateEntree) : new Date(),
        datePriseMesure: data.datePriseMesure ? new Date(data.datePriseMesure) : null,
        mesureDonneeLe: data.mesureDonneeLe ? new Date(data.mesureDonneeLe) : null,
        dateReceptionFibre: data.dateReceptionFibre ? new Date(data.dateReceptionFibre) : null,
        dateEnvoieFibre: data.dateEnvoieFibre ? new Date(data.dateEnvoieFibre) : null,
        dateReceptionLimons: data.dateReceptionLimons ? new Date(data.dateReceptionLimons) : null,
        dateEnvoieLimons: data.dateEnvoieLimons ? new Date(data.dateEnvoieLimons) : null,
        dateReceptionVerre: data.dateReceptionVerre ? new Date(data.dateReceptionVerre) : null,
        dateEnvoieVerres: data.dateEnvoieVerres ? new Date(data.dateEnvoieVerres) : null,
        dateReceptionColonnes: data.dateReceptionColonnes ? new Date(data.dateReceptionColonnes) : null,
        dateEnvoieColonnes: data.dateEnvoieColonnes ? new Date(data.dateEnvoieColonnes) : null,
        dateReceptionPeinture: data.dateReceptionPeinture ? new Date(data.dateReceptionPeinture) : null,
        dateEnvoiePeinture: data.dateEnvoiePeinture ? new Date(data.dateEnvoiePeinture) : null,
        dateReceptionAttaches: data.dateReceptionAttaches ? new Date(data.dateReceptionAttaches) : null,
        dateEnvoieAttaches: data.dateEnvoieAttaches ? new Date(data.dateEnvoieAttaches) : null,
        dateReceptionPlancherAluminium: data.dateReceptionPlancherAluminium ? new Date(data.dateReceptionPlancherAluminium) : null,
        dateEnvoiePlancherAluminium: data.dateEnvoiePlancherAluminium ? new Date(data.dateEnvoiePlancherAluminium) : null,
        dateAvertissement: data.dateAvertissement ? new Date(data.dateAvertissement) : null,
        dateAvertissementPriseMesure: data.dateAvertissementPriseMesure ? new Date(data.dateAvertissementPriseMesure) : null,
        
        // Créer les balcons si nécessaire
        balcons: balcons && balcons.length > 0 ? {
          create: balcons.map((b, index) => ({
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
        } : undefined,

        // NOUVEAU: Créer les structures d'achat
        structuresAchat: structuresAchat && structuresAchat.length > 0 ? {
          create: structuresAchat.map(s => ({
            nom: s.nom,
            statutAchat: s.statutAchat || "A_FAIRE",
            dateEnvoie: s.dateEnvoie ? new Date(s.dateEnvoie) : null,
            dateReception: s.dateReception ? new Date(s.dateReception) : null,
            quantiteNonRecue: s.quantiteNonRecue || null,
          })),
        } : undefined,
      },
      include: {
        client: { select: { id: true, nom: true, type: true } },
        representant: { select: { id: true, nom: true } },
        balcons: true,
        structuresAchat: true,
      },
    });

    // Créer une entrée dans l'historique
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