import { NextResponse,NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { commandeSchema } from "./schema";

// GET - Liste toutes les commandes avec filtres et stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statut = searchParams.get("statut");
    const type = searchParams.get("type");
    const service = searchParams.get("service");
    const clientId = searchParams.get("clientId");

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

    // Récupérer les commandes
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
        _count: {
          select: { interventions: true, reprises: true },
        },
      },
      orderBy: { dateEntree: "desc" },
    });

    // Calculer les statistiques
    const allCommandes = await prisma.commande.findMany({
      select: { statut: true, typeCommande: true, service: true, enProduction: true, datePrevue: true },
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
        MESURE: allCommandes.filter(c => c.service === "MESURE").length,
      },
      enProduction: allCommandes.filter(c => c.enProduction).length,
      enRetard: allCommandes.filter(c => c.datePrevue && new Date(c.datePrevue) < new Date() && c.statut === "ACTIVE").length,
    };

    return NextResponse.json({ commandes, stats });
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

    // Calculer le prix total
    const prixTotal = (data.prixVenteMateriaux || 0) + (data.prixVenteInstallation || 0);

    // Calculer les dates si dateProduction est fournie
    let datePrevue = data.datePrevue ? new Date(data.datePrevue) : null;
    let dateLivraison = data.dateLivraison ? new Date(data.dateLivraison) : null;
    
    if (data.dateProduction && !datePrevue) {
      const dateProduction = new Date(data.dateProduction);
      datePrevue = new Date(dateProduction);
      datePrevue.setDate(datePrevue.getDate() - 7);
      dateLivraison = datePrevue;
    }

    // Extraire les balcons du body
    const { balcons, ...commandeData } = data;

    // Créer la commande
    const commande = await prisma.commande.create({
      data: {
        ...commandeData,
        prixTotal,
        datePrevue,
        dateLivraison,
        dateEntree: data.dateEntree ? new Date(data.dateEntree) : new Date(),
        dateProduction: data.dateProduction ? new Date(data.dateProduction) : null,
        datePriseMesure: data.datePriseMesure ? new Date(data.datePriseMesure) : null,
        mesureDonneeLe: data.mesureDonneeLe ? new Date(data.mesureDonneeLe) : null,
        dateReceptionFibre: data.dateReceptionFibre ? new Date(data.dateReceptionFibre) : null,
        dateReceptionLimons: data.dateReceptionLimons ? new Date(data.dateReceptionLimons) : null,
        dateReceptionVerre: data.dateReceptionVerre ? new Date(data.dateReceptionVerre) : null,
        dateReceptionColonnes: data.dateReceptionColonnes ? new Date(data.dateReceptionColonnes) : null,
        dateReceptionPeinture: data.dateReceptionPeinture ? new Date(data.dateReceptionPeinture) : null,
        dateReceptionAttaches: data.dateReceptionAttaches ? new Date(data.dateReceptionAttaches) : null,
        dateReceptionPlancherAluminium: data.dateReceptionPlancherAluminium ? new Date(data.dateReceptionPlancherAluminium) : null,
        dateAvertissement: data.dateAvertissement ? new Date(data.dateAvertissement) : null,
        dateAvertissementPriseMesure: data.dateAvertissementPriseMesure ? new Date(data.dateAvertissementPriseMesure) : null,
        // Créer les balcons si type COMMERCIAL, MULTI_PHASE ou MULTIPLAN
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
      },
      include: {
        client: { select: { id: true, nom: true, type: true } },
        representant: { select: { id: true, nom: true } },
        balcons: true,
      },
    });

    return NextResponse.json(commande, { status: 201 });
  } catch (error) {
    console.error("Erreur POST commande:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}