import { prisma } from '@/lib/prisma';
import { CODES_ATTENTE, type CommandeAttente, type StatsAttentes } from '@/app/api/attentes/schema';

// ╔══════════════════════════════════════════╗
// ║         SERVICE ATTENTES (SERVEUR)        ║
// ╚══════════════════════════════════════════╝

/**
 * Détermine si une commande a au moins un code "en attente"
 */
function detecterAttente(commande: any): { typeAttente: string | null; etapeAttente: string | null } {
  const etapes = [
    { champ: 'mesure', label: 'Mesure' },
    { champ: 'plan', label: 'Plan' },
    { champ: 'envoyeProduction', label: 'Envoyé Production' },
    { champ: 'productionTerminee', label: 'Production terminée' },
    { champ: 'termine', label: 'Terminé' },
  ];

  for (const etape of etapes) {
    const val = commande[etape.champ];
    if (val && CODES_ATTENTE.includes(val)) {
      const type = val === 'ATTENTE_CLIENT' ? 'client'
        : val === 'ATTENTE_REPRESENTANT' ? 'representant'
        : 'autre';
      return { typeAttente: type, etapeAttente: etape.label };
    }
  }
  return { typeAttente: null, etapeAttente: null };
}

/**
 * Récupère toutes les commandes actives ayant au moins un code en attente
 */
export async function getCommandesEnAttente(filtres?: {
  representantIds?: string[];
  recherche?: string;
}): Promise<CommandeAttente[]> {
  const commandes = await prisma.commande.findMany({
    where: {
      statut: { in: ['ACTIVE', 'EN_ATTENTE'] },
      ...(filtres?.representantIds?.length ? { representantId: { in: filtres.representantIds } } : {}),
      ...(filtres?.recherche ? {
        OR: [
          { numero: { contains: filtres.recherche } },
          { client: { nom: { contains: filtres.recherche } } },
        ],
      } : {}),
    },
    include: {
      client: { select: { nom: true, adresse: true, telephone: true } },
      representant: { select: { id: true, nom: true, email: true } },
      envoisAttente: {
        orderBy: { dateEnvoi: 'desc' },
        take: 1,
        select: { dateEnvoi: true },
      },
    },
    orderBy: [{ representant: { nom: 'asc' } }, { dateEntree: 'asc' }],
  });

  const commandesAttente: CommandeAttente[] = [];

  for (const cmd of commandes) {
    const { typeAttente, etapeAttente } = detecterAttente(cmd);
    if (!typeAttente) continue;

    const dernierEnvoi = cmd.envoisAttente?.[0]?.dateEnvoi;

    commandesAttente.push({
      id: cmd.id,
      numero: cmd.numero,
      clientNom: cmd.client.nom,
      clientAdresse: cmd.client.adresse || null,
      clientTelephone: cmd.client.telephone || null,
      representantId: cmd.representantId,
      representantNom: cmd.representant?.nom || null,
      dateEntree: cmd.dateEntree.toISOString(),
      datePrevue: cmd.datePrevue?.toISOString() || null,
      service: cmd.service,
      couleur: cmd.couleurPersonnalisee || cmd.couleur || null,
      couleurPersonnalisee: cmd.couleurPersonnalisee || null,
      piedsLineaires: cmd.piedsLineairesReels || cmd.piedsLineairesEstime || null,
      commentaire: cmd.commentaire || null,
      mesure: cmd.mesure || null,
      plan: cmd.plan || null,
      envoyeProduction: cmd.envoyeProduction || null,
      productionTerminee: cmd.productionTerminee || null,
      termine: cmd.termine || null,
      typeAttente,
      etapeAttente,
      dateDernierEnvoi: dernierEnvoi?.toISOString() || null,
      attenteEnvoyee: dernierEnvoi ? isRecent(dernierEnvoi) : false,
    });
  }

  return commandesAttente;
}

/**
 * Calcule les statistiques des attentes
 */
export async function getStatsAttentes(commandes: CommandeAttente[]): Promise<StatsAttentes> {
  const totalCommandes = await prisma.commande.count({
    where: { statut: { in: ['ACTIVE', 'EN_ATTENTE'] } },
  });

  const totalEnAttente = commandes.length;
  const pourcentageEnAttente = totalCommandes > 0 ? Math.round((totalEnAttente / totalCommandes) * 100) : 0;

  // Par représentant
  const repMap = new Map<string, { nom: string; count: number; dernierEnvoi: string | null }>();
  for (const cmd of commandes) {
    if (!cmd.representantId) continue;
    const existing = repMap.get(cmd.representantId);
    if (existing) {
      existing.count++;
      if (cmd.dateDernierEnvoi && (!existing.dernierEnvoi || cmd.dateDernierEnvoi > existing.dernierEnvoi)) {
        existing.dernierEnvoi = cmd.dateDernierEnvoi;
      }
    } else {
      repMap.set(cmd.representantId, { nom: cmd.representantNom || '—', count: 1, dernierEnvoi: cmd.dateDernierEnvoi });
    }
  }
  const parRepresentant = Array.from(repMap.entries())
    .map(([id, data]) => ({ representantId: id, ...data }))
    .sort((a, b) => b.count - a.count);

  // Par type d'attente
  const typeMap = new Map<string, number>();
  for (const cmd of commandes) {
    const t = cmd.typeAttente || 'autre';
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  }
  const parTypeAttente = Array.from(typeMap.entries()).map(([type, count]) => ({
    type,
    label: type === 'client' ? 'Attente client' : type === 'representant' ? 'Attente représentant' : 'Autre',
    count,
    pourcentage: totalEnAttente > 0 ? Math.round((count / totalEnAttente) * 100) : 0,
  }));

  // Par service
  const svcMap = new Map<string, number>();
  for (const cmd of commandes) {
    svcMap.set(cmd.service, (svcMap.get(cmd.service) || 0) + 1);
  }
  const parService = Array.from(svcMap.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  // Par ancienneté
  const now = new Date();
  const tranches = [
    { label: '< 1 semaine', maxDays: 7 },
    { label: '1-4 semaines', maxDays: 28 },
    { label: '1-3 mois', maxDays: 90 },
    { label: '3-6 mois', maxDays: 180 },
    { label: '6-12 mois', maxDays: 365 },
    { label: '> 1 an', maxDays: Infinity },
  ];
  const ancienneteMap = new Map<string, number>();
  tranches.forEach((t) => ancienneteMap.set(t.label, 0));
  for (const cmd of commandes) {
    const days = Math.floor((now.getTime() - new Date(cmd.dateEntree).getTime()) / (1000 * 60 * 60 * 24));
    for (const t of tranches) {
      if (days < t.maxDays) {
        ancienneteMap.set(t.label, (ancienneteMap.get(t.label) || 0) + 1);
        break;
      }
    }
  }
  const parAnciennete = tranches.map((t) => ({ tranche: t.label, count: ancienneteMap.get(t.label) || 0 }));

  return { totalEnAttente, totalCommandes, pourcentageEnAttente, parRepresentant, parTypeAttente, parService, parAnciennete };
}

function isRecent(date: Date): boolean {
  return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
}

export async function getRepresentantsActifs() {
  return prisma.representant.findMany({
    where: { actif: true },
    select: { id: true, nom: true, email: true, telephone: true, actif: true },
    orderBy: { nom: 'asc' },
  });
}