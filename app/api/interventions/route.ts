// app/api/interventions/route.ts or pages/api/interventions.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Make sure prisma is correctly configured
import type { InterventionView, StatsInterventions } from '@/app/api/interventions/schema';

function toISO(d: Date | null | undefined): string {
  return d ? d.toISOString() : '';
}

function mapIntervention(i: any): InterventionView {
  return {
    id: i.id,
    commandeId: i.commandeId,
    commandeNumero: i.commande?.numero || '—',
    clientNom: i.commande?.client?.nom || '—',
    clientVille: i.commande?.client?.ville || null,
    clientTelephone: i.commande?.client?.telephone || null,
    adresse: i.commande?.adresse || '',
    type: i.type,
    datePrevue: toISO(i.datePrevue),
    heureDebut: i.heureDebut, heureFin: i.heureFin,
    statut: i.statut,
    equipeNom: i.equipe?.nom || null,
    equipeCouleur: i.equipe?.couleur || null,
    responsableNom: i.responsable ? `${i.responsable.prenom} ${i.responsable.nom}` : null,
    formulaireComplete: i.formulaireComplete,
    notes: i.notes,
    heureArrivee: i.heureArrivee, heureDepart: i.heureDepart,
    personneRessource: i.personneRessource, telephone: i.telephone,
    accessibiliteBalcon: i.accessibiliteBalcon, balconEncombre: i.balconEncombre,
    niveauBalconConforme: i.niveauBalconConforme, backingConforme: i.backingConforme,
    colonneCapage: i.colonneCapage, noteAvant: i.noteAvant,
    travauxNonComplete: i.travauxNonComplete, travauxNonCompleteNote: i.travauxNonCompleteNote,
    mainsInstallees: i.mainsInstallees, cacheVisInstallees: i.cacheVisInstallees,
    capsulesPoteaux: i.capsulesPoteaux, vuEnsemble: i.vuEnsemble, noteApres: i.noteApres,
    materielComplet: i.materielComplet, etatMateriel: i.etatMateriel,
    quantiteConforme: i.quantiteConforme, emplacementLivraison: i.emplacementLivraison,
    accessibilite: i.accessibilite, noteLivraison: i.noteLivraison,
    materielIdentifie: i.materielIdentifie, etatMaterielRecupere: i.etatMaterielRecupere,
    quantiteRecuperee: i.quantiteRecuperee, emplacementCueillette: i.emplacementCueillette,
    difficulteAcces: i.difficulteAcces, noteCueillette: i.noteCueillette,
    listeMateriels: i.listeMateriels,
    adresseDepart: i.adresseDepart, adresseArrivee: i.adresseArrivee,
    vehiculeInspecte: i.vehiculeInspecte, chargementSecurise: i.chargementSecurise,
    documentationComplete: i.documentationComplete,
    kmDepart: i.kmDepart, kmArrivee: i.kmArrivee,
    membresEquipe: i.membresEquipe, materielTransporte: i.materielTransporte,
    noteTransport: i.noteTransport,
    signatureInstallateur: i.signatureInstallateur, signatureClient: i.signatureClient,
    signatureLivreur: i.signatureLivreur, signatureChauffeur: i.signatureChauffeur,
    dateSignature: i.dateSignature ? toISO(i.dateSignature) : null,
    photos: (i.photos || []).map((p: any) => ({
      id: p.id, type: p.type, url: p.url, description: p.description,
      createdAt: toISO(p.createdAt),
    })),
    tempsEstimeInstallation: i.commande?.tempsEstimeInstallation || 0,
    couleur: i.commande?.couleurPersonnalisee || i.commande?.couleur || null,
    mesure: i.commande?.mesure || null,
    plan: i.commande?.plan || null,
    productionTerminee: i.commande?.productionTerminee || null,
  };
}

const INCLUDE = {
  commande: {
    select: {
      numero: true, adresse: true, tempsEstimeInstallation: true,
      couleur: true, couleurPersonnalisee: true, mesure: true, plan: true, productionTerminee: true,
      client: { select: { nom: true, ville: true, telephone: true } },
    },
  },
  equipe: { select: { nom: true, couleur: true } },
  responsable: { select: { nom: true, prenom: true } },
  photos: { orderBy: { createdAt: 'desc' as const } },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const periode = searchParams.get('periode') || 'toutes';
    const recherche = searchParams.get('recherche') || '';

    const where: any = {};
    
    // Validate the type parameter
    if (type) where.type = type;
    
    if (recherche) {
      where.OR = [
        { commande: { numero: { contains: recherche } } },
        { commande: { client: { nom: { contains: recherche } } } },
        { commande: { adresse: { contains: recherche } } },
      ];
    }

    // Handle period filters (e.g., today, this week)
    const now = new Date();
    if (periode === 'aujourdhui') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      where.datePrevue = { gte: start, lte: end };
    } else if (periode === 'semaine') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      where.datePrevue = { gte: start, lte: end };
    }

    // Fetch interventions from the database
    const interventions = await prisma.intervention.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ datePrevue: 'asc' }, { heureDebut: 'asc' }],
    });

    // Map the results to your custom view
    const data = interventions.map(mapIntervention);

    // Calculate stats
    const stats: StatsInterventions = {
      total: data.length,
      installations: data.filter((i) => i.type === 'INSTALLATION').length,
      livraisons: data.filter((i) => i.type === 'LIVRAISON').length,
      cueillettes: data.filter((i) => i.type === 'CUEILLETTE').length,
      transports: data.filter((i) => i.type === 'TRANSPORT').length,
      completees: data.filter((i) => i.statut === 'COMPLETEE').length,
      heuresEstimees: data.reduce((acc, i) => acc + (i.tempsEstimeInstallation || 1), 0),
    };

    return NextResponse.json({ interventions: data, stats });
  } catch (error) {
    console.error('GET /api/interventions erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}