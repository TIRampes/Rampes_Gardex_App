import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlanificationCreateSchema } from '@/app/api/planification/schema';
import type { PlanificationView, StatsPlanification } from'@/app/api/planification/schema';

function toISO(d: Date | null | undefined): string { return d ? d.toISOString() : ''; }

// Client n'a PAS de champ "email" — il a "emails" (Json) et "telephone"
const INCLUDE = {
  commande: {
    select: {
      numero: true, adresse: true, reference: true, typeCommande: true, service: true,
      couleur: true, couleurPersonnalisee: true, reprise: true, commentaire: true,
      dateEntree: true, datePrevue: true, tempsEstimeInstallation: true,
      piedsLineairesRampes: true, mesure: true, plan: true, envoyeProduction: true, productionTerminee: true,
      achatVerres: true, achatLimons: true, achatPeinture: true, achatColonnes: true,
      achatFibre: true, achatAttaches: true, achatPlancherAluminium: true,
      client: { select: { nom: true, ville: true, telephone: true, emails: true } },
    },
  },
  equipe: { select: { id: true, nom: true, couleur: true } },
  chauffeur: { select: { id: true, nom: true } },
  vehicule: { select: { id: true, nom: true } },
};

function extractEmail(emails: any): string | null {
  if (!emails) return null;
  if (typeof emails === 'string') return emails;
  if (Array.isArray(emails) && emails.length > 0) return emails[0];
  if (typeof emails === 'object' && emails.principal) return emails.principal;
  return null;
}

function mapPlanif(p: any): PlanificationView {
  const c = p.commande;
  return {
    id: p.id, commandeId: p.commandeId,
    commandeNumero: c?.numero || '—', clientNom: c?.client?.nom || '—',
    clientVille: c?.client?.ville || null, clientTelephone: c?.client?.telephone || null,
    clientEmail: extractEmail(c?.client?.emails), adresse: c?.adresse || '',
    reference: c?.reference || null, typeCommande: c?.typeCommande || 'STANDARD',
    service: c?.service || 'INSTALLATION', couleur: c?.couleurPersonnalisee || c?.couleur || null,
    reprise: c?.reprise || false, commentaire: c?.commentaire || null,
    dateEntree: toISO(c?.dateEntree), datePlanifiee: toISO(p.datePlanifiee),
    heureDebut: p.heureDebut, heureFin: p.heureFin, statut: p.statut,
    equipeId: p.equipeId || null, equipeNom: p.equipe?.nom || null,
    equipeCouleur: p.equipe?.couleur || 'bg-slate-500',
    chauffeurId: p.chauffeurId || null, chauffeurNom: p.chauffeur?.nom || null,
    vehiculeId: p.vehiculeId || null, vehiculeNom: p.vehicule?.nom || null,
    clientPresent: p.clientPresent, representantPresent: p.representantPresent,
    envoyerAvis: p.envoyerAvis, avisEnvoye: p.avisEnvoye,
    avisClientEnvoye: p.avisClientEnvoye ?? false,
    avisClientDate: p.avisClientDate ? toISO(p.avisClientDate) : null,
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
    const mois = searchParams.get('mois');
    const type = searchParams.get('type') || '';
    const equipeId = searchParams.get('equipeId') || '';
    const typeCommande = searchParams.get('typeCommande') || '';

    const where: any = { statut: { notIn: ['ANNULEE'] } };

    if (type) {
      where.commande = { service: type.toUpperCase() };
    }

    if (equipeId) {
      where.OR = [{ equipeId: equipeId }, { equipeId: null }];
    }

    if (mois) {
      const parts = mois.split('-');
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const start = new Date(y, m - 1, -14);
      const end = new Date(y, m, 15);
      where.datePlanifiee = { gte: start, lt: end };
    }

    if (typeCommande && typeCommande !== 'tous') {
      if (where.commande) {
        where.commande.typeCommande = typeCommande.toUpperCase();
      } else {
        where.commande = { typeCommande: typeCommande.toUpperCase() };
      }
    }

    const planifs = await prisma.planification.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ datePlanifiee: 'asc' }],
    });

    const data = planifs.map(mapPlanif);

    // Stats semaine courante
    const now = new Date();
    const wStart = new Date(now);
    wStart.setDate(now.getDate() - now.getDay());
    wStart.setHours(0, 0, 0, 0);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);
    const sem = data.filter((p) => {
      const d = new Date(p.datePlanifiee);
      return d >= wStart && d <= wEnd;
    });

    let nbNonPlanifiees = 0;
    try {
      nbNonPlanifiees = await prisma.commande.count({
        where: { statut: 'ACTIVE', planifications: { none: {} } },
      });
    } catch { nbNonPlanifiees = 0; }

    const stats: StatsPlanification = {
      nbPlanifiees: sem.length,
      heuresTotal: sem.reduce((a, p) => a + (p.tempsEstimeInstallation || 0), 0),
      piedsTotal: sem.reduce((a, p) => a + (p.piedsLineaires || 0), 0),
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
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const commande = await prisma.commande.findUnique({ where: { id: d.commandeId } });
    if (!commande) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    const createData: any = {
      commandeId: d.commandeId,
      datePlanifiee: new Date(d.datePlanifiee),
      heureDebut: d.heureDebut || null,
      heureFin: d.heureFin || null,
      clientPresent: d.clientPresent ?? false,
      representantPresent: d.representantPresent ?? false,
      envoyerAvis: d.envoyerAvis ?? false,
      notes: d.notes || null,
    };

    if (d.equipeId && d.equipeId.trim() !== '') createData.equipeId = d.equipeId;
    if (d.chauffeurId && d.chauffeurId.trim() !== '') createData.chauffeurId = d.chauffeurId;
    if (d.vehiculeId && d.vehiculeId.trim() !== '') createData.vehiculeId = d.vehiculeId;

    const planif = await prisma.planification.create({ data: createData });

    await prisma.commande.update({
      where: { id: d.commandeId },
      data: { datePrevue: new Date(d.datePlanifiee) },
    });

    // Créer intervention
    try {
      const intData: any = {
        commandeId: d.commandeId,
        type: commande.service,
        datePrevue: new Date(d.datePlanifiee),
        heureDebut: d.heureDebut || null,
        heureFin: d.heureFin || null,
        statut: 'PLANIFIEE',
        notes: d.notes || null,
      };
      if (d.equipeId && d.equipeId.trim() !== '') intData.equipeId = d.equipeId;
      await prisma.intervention.create({ data: intData });
    } catch (intErr) {
      console.error('Intervention create warning:', intErr);
    }

    return NextResponse.json(planif, { status: 201 });
  } catch (error) {
    console.error('POST /api/planification erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}