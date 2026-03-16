import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlanificationCreateSchema } from"@/app/api/planification/schema";
import type { PlanificationView, StatsPlanification } from "@/app/api/planification/schema";

function toISO(d: Date | null | undefined): string { return d ? d.toISOString() : ''; }

const INCLUDE = {
  commande: {
    select: {
      numero: true, adresse: true, reference: true, typeCommande: true, service: true,
      couleur: true, couleurPersonnalisee: true, reprise: true, commentaire: true,
      dateEntree: true, tempsEstimeInstallation: true,
      piedsLineairesBarrotin: true, piedsLineairesVerre: true, piedsLineairesMur: true,
      piedsLineairesMainDouble: true, piedsLineairesRampes: true,
      mesure: true, plan: true, envoyeProduction: true, productionTerminee: true,
      achatVerres: true, achatLimons: true, achatPeinture: true, achatColonnes: true,
      achatFibre: true, achatAttaches: true, achatPlancherAluminium: true,
      client: { select: { nom: true, ville: true, telephone: true } },
    },
  },
  equipe: { select: { id: true, nom: true, couleur: true } },
};

function mapPlanif(p: any): PlanificationView {
  const c = p.commande;
  return {
    id: p.id, commandeId: p.commandeId,
    commandeNumero: c?.numero || '—',
    clientNom: c?.client?.nom || '—',
    clientVille: c?.client?.ville || null,
    clientTelephone: c?.client?.telephone || null,
    adresse: c?.adresse || '',
    reference: c?.reference || null,
    typeCommande: c?.typeCommande || 'STANDARD',
    service: c?.service || 'INSTALLATION',
    couleur: c?.couleurPersonnalisee || c?.couleur || null,
    reprise: c?.reprise || false,
    commentaire: c?.commentaire || null,
    dateEntree: toISO(c?.dateEntree),
    datePlanifiee: toISO(p.datePlanifiee),
    heureDebut: p.heureDebut, heureFin: p.heureFin,
    statut: p.statut,
    equipeId: p.equipeId,
    equipeNom: p.equipe?.nom || '—',
    equipeCouleur: p.equipe?.couleur || 'bg-slate-500',
    clientPresent: p.clientPresent, representantPresent: p.representantPresent,
    envoyerAvis: p.envoyerAvis, avisEnvoye: p.avisEnvoye,
    notes: p.notes,
    tempsEstimeInstallation: c?.tempsEstimeInstallation || 0,
    piedsLineaires: c?.piedsLineairesRampes || 0,
    mesure: c?.mesure || null, plan: c?.plan || null,
    envoyeProduction: c?.envoyeProduction || null, productionTerminee: c?.productionTerminee || null,
    achatVerres: c?.achatVerres || null, achatLimons: c?.achatLimons || null,
    achatPeinture: c?.achatPeinture || null, achatColonnes: c?.achatColonnes || null,
    achatFibre: c?.achatFibre || null, achatAttaches: c?.achatAttaches || null,
    achatPlancherAluminium: c?.achatPlancherAluminium || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mois = searchParams.get('mois'); // format: 2026-01
    const type = searchParams.get('type') || '';
    const equipeId = searchParams.get('equipeId') || '';
    const typeCommande = searchParams.get('typeCommande') || '';

    const where: any = { statut: { notIn: ['ANNULEE'] } };
    if (equipeId) where.equipeId = equipeId;
    if (type) where.commande = { service: type.toUpperCase() };

    if (mois) {
      const [y, m] = mois.split('-').map(Number);
      where.datePlanifiee = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    if (typeCommande && typeCommande !== 'tous') {
      where.commande = { ...where.commande, typeCommande: typeCommande.toUpperCase() };
    }

    const planifs = await prisma.planification.findMany({ where, include: INCLUDE, orderBy: [{ datePlanifiee: 'asc' }, { heureDebut: 'asc' }] });
    const data = planifs.map(mapPlanif);

    // Stats semaine courante
    const now = new Date();
    const wStart = new Date(now); wStart.setDate(now.getDate() - now.getDay()); wStart.setHours(0, 0, 0, 0);
    const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate() + 6); wEnd.setHours(23, 59, 59, 999);
    const semaine = data.filter((p) => { const d = new Date(p.datePlanifiee); return d >= wStart && d <= wEnd; });

    // Count non-planifiees
    const nbNonPlanifiees = await prisma.commande.count({
      where: {
        statut: 'ACTIVE',
        service: { in: ['INSTALLATION'] },
        productionTerminee: 'COMPLETE',
        planifications: { none: { statut: { notIn: ['ANNULEE'] } } },
      },
    });

    const stats: StatsPlanification = {
      nbPlanifiees: semaine.length,
      heuresTotal: semaine.reduce((a, p) => a + (p.tempsEstimeInstallation || 0), 0),
      piedsTotal: semaine.reduce((a, p) => a + (p.piedsLineaires || 0), 0),
      nbNonPlanifiees,
    };

    return NextResponse.json({ planifications: data, stats });
  } catch (error) {
    console.error('GET /api/planification erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PlanificationCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const commande = await prisma.commande.findUnique({ where: { id: d.commandeId } });
    if (!commande) return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    const equipe = await prisma.equipe.findUnique({ where: { id: d.equipeId } });
    if (!equipe) return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });

    const planif = await prisma.planification.create({
      data: {
        commandeId: d.commandeId,
        equipeId: d.equipeId,
        datePlanifiee: new Date(d.datePlanifiee),
        heureDebut: d.heureDebut || null,
        heureFin: d.heureFin || null,
        clientPresent: d.clientPresent,
        representantPresent: d.representantPresent,
        envoyerAvis: d.envoyerAvis,
        notes: d.notes || null,
      },
    });

    // Mettre à jour datePrevue et equipe sur la commande aussi
    await prisma.commande.update({
      where: { id: d.commandeId },
      data: { datePrevue: new Date(d.datePlanifiee) },
    });

    // Créer l'intervention correspondante
    await prisma.intervention.create({
      data: {
        commandeId: d.commandeId,
        equipeId: d.equipeId,
        type: commande.service as any,
        datePrevue: new Date(d.datePlanifiee),
        heureDebut: d.heureDebut || null,
        heureFin: d.heureFin || null,
        statut: 'PLANIFIEE',
        notes: d.notes || null,
      },
    });

    return NextResponse.json(planif, { status: 201 });
  } catch (error) {
    console.error('POST /api/planification erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}