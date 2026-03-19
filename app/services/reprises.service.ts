import { prisma } from '@/lib/prisma';
import type { RepriseView, StatsReprises } from '@/app/api/reprises/schema';
import { TYPE_REPRISE_MAP } from '@/app/api/reprises/schema';

// ╔══════════════════════════════════════════╗
// ║        SERVICE REPRISES (SERVEUR)         ║
// ╚══════════════════════════════════════════╝

/**
 * Fonction interne pour créer les records manquants dans la table Reprise
 * à partir des commandes marquées comme "reprise"
 */
async function synchroniserCommandesReprises() {
  // On cherche les commandes marquées reprise qui n'ont AUCUNE entrée dans la table Reprise
  const commandesSansDossier = await prisma.commande.findMany({
    where: {
      reprise: true,
      reprises: { none: {} } 
    },
    select: {
      id: true,
      clientId: true,
      updatedAt: true
    }
  });

  if (commandesSansDossier.length > 0) {
    // Création des dossiers de reprise manquants
    await Promise.all(
      commandesSansDossier.map((cmd) =>
        prisma.reprise.create({
          data: {
            commandeId: cmd.id,
            clientId: cmd.clientId,
            typeReprise: 'AUTRE',
            raison: 'Automatique : Commande marquée comme reprise',
            dateReprise: new Date(),
            statut: 'PLANIFIEE',
            priorite: 'MOYENNE',
            nombreReprises: 1,
            completee: false,
          },
        })
      )
    );
  }
}

function mapReprise(r: any): RepriseView {
  return {
    id: r.id,
    commandeId: r.commandeId,
    commandeNumero: r.commande?.numero || '—',
    clientId: r.clientId,
    clientNom: r.client?.nom || '—',
    clientVille: r.client?.ville || null,
    clientTelephone: r.client?.telephone || null,
    commandeAdresse: r.commande?.adresse || null,
    commandeService: r.commande?.service || null,
    commandeCouleur: r.commande?.couleurPersonnalisee || r.commande?.couleur || null,
    commandeCommentaire: r.commande?.commentaire || null,
    representantNom: r.commande?.representant?.nom || null,
    typeReprise: r.typeReprise,
    raison: r.raison,
    dateReprise: r.dateReprise?.toISOString() || '',
    dateOrigine: r.dateOrigine?.toISOString() || null,
    dateCompletion: r.dateCompletion?.toISOString() || null,
    nombreReprises: r.nombreReprises,
    tempsEstime: r.tempsEstime,
    statut: r.statut,
    priorite: r.priorite,
    responsable: r.responsable,
    notes: r.notes,
    completee: r.completee,
  };
}

const INCLUDE_RELATIONS = {
  commande: {
    select: {
      numero: true, adresse: true, service: true, couleur: true,
      couleurPersonnalisee: true, commentaire: true,
      representant: { select: { nom: true } },
    },
  },
  client: { select: { nom: true, ville: true, telephone: true } },
};

export async function getReprisesActives(filtres?: {
  recherche?: string;
  typeReprise?: string;
  priorite?: string;
  periode?: string;
}): Promise<RepriseView[]> {
  
  // Sincroniser avant de récupérer les données
  await synchroniserCommandesReprises();

  const where: any = { completee: false };

  if (filtres?.typeReprise) where.typeReprise = filtres.typeReprise;
  if (filtres?.priorite) where.priorite = filtres.priorite;
  if (filtres?.recherche) {
    where.OR = [
      { commande: { numero: { contains: filtres.recherche } } },
      { client: { nom: { contains: filtres.recherche } } },
      { raison: { contains: filtres.recherche } },
    ];
  }

  const data = await prisma.reprise.findMany({
    where,
    include: INCLUDE_RELATIONS,
    orderBy: [{ priorite: 'asc' }, { dateReprise: 'desc' }],
  });

  let result = data.map(mapReprise);

  if (filtres?.periode) {
    const now = new Date();
    result = result.filter((r) => {
      const d = new Date(r.dateReprise);
      switch (filtres.periode) {
        case 'jour': return d.toDateString() === now.toDateString();
        case 'semaine': {
          const debut = new Date(now);
          debut.setDate(now.getDate() - now.getDay());
          debut.setHours(0, 0, 0, 0);
          const fin = new Date(debut);
          fin.setDate(debut.getDate() + 7);
          return d >= debut && d < fin;
        }
        case 'mois': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case 'annee': return d.getFullYear() === now.getFullYear();
        default: return true;
      }
    });
  }

  return result;
}

export async function getReprisesHistorique(filtres?: {
  recherche?: string;
  typeReprise?: string;
}): Promise<RepriseView[]> {
  const where: any = { completee: true };

  if (filtres?.typeReprise) where.typeReprise = filtres.typeReprise;
  if (filtres?.recherche) {
    where.OR = [
      { commande: { numero: { contains: filtres.recherche } } },
      { client: { nom: { contains: filtres.recherche } } },
    ];
  }

  const data = await prisma.reprise.findMany({
    where,
    include: INCLUDE_RELATIONS,
    orderBy: { dateCompletion: 'desc' },
  });

  return data.map(mapReprise);
}

export async function getStatsReprises(filtresPeriode?: {
  periode?: string;
  annee?: number;
}): Promise<StatsReprises> {
  
  // Sincroniser pour que les stats incluent les nouvelles commandes cochées
  await synchroniserCommandesReprises();

  const toutes = await prisma.reprise.findMany({
    select: { typeReprise: true, completee: true, nombreReprises: true, dateReprise: true, commande: { select: { numero: true } } },
  });

  const now = new Date();
  const totalActives = toutes.filter((r) => !r.completee).length;
  const totalHistorique = toutes.filter((r) => r.completee).length;
  const totalToutes = toutes.length;
  const commandesMultiReprises = toutes.filter((r) => r.nombreReprises > 1).length;

  let dataFiltree = toutes;
  if (filtresPeriode?.periode) {
    dataFiltree = toutes.filter((r) => {
      const d = new Date(r.dateReprise);
      switch (filtresPeriode.periode) {
        case 'semaine': {
          const debut = new Date(now);
          debut.setDate(now.getDate() - now.getDay());
          debut.setHours(0, 0, 0, 0);
          const fin = new Date(debut);
          fin.setDate(debut.getDate() + 7);
          return d >= debut && d < fin;
        }
        case 'mois': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case 'annee': return d.getFullYear() === (filtresPeriode.annee || now.getFullYear());
        default: return true;
      }
    });
  }

  const totalFiltre = dataFiltree.length;
  const typeMap = new Map<string, number>();
  for (const r of dataFiltree) {
    typeMap.set(r.typeReprise, (typeMap.get(r.typeReprise) || 0) + 1);
  }
  const parType = Array.from(typeMap.entries())
    .map(([type, count]) => ({
      type,
      label: TYPE_REPRISE_MAP[type]?.label || type,
      count,
      pourcentage: totalFiltre > 0 ? Math.round((count / totalFiltre) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const isDay = (d: Date) => d.toDateString() === now.toDateString();
  const isWeek = (d: Date) => {
    const debut = new Date(now);
    debut.setDate(now.getDate() - now.getDay());
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setDate(debut.getDate() + 7);
    return d >= debut && d < fin;
  };
  const isMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const isYear = (d: Date) => d.getFullYear() === now.getFullYear();

  const parPeriode = {
    jour: toutes.filter((r) => isDay(new Date(r.dateReprise))).length,
    semaine: toutes.filter((r) => isWeek(new Date(r.dateReprise))).length,
    mois: toutes.filter((r) => isMonth(new Date(r.dateReprise))).length,
    annee: toutes.filter((r) => isYear(new Date(r.dateReprise))).length,
  };

  return { totalActives, totalHistorique, totalToutes, commandesMultiReprises, parType, parPeriode };
}

export async function completerReprise(id: string) {
  return prisma.reprise.update({
    where: { id },
    data: { statut: 'COMPLETEE', completee: true, dateCompletion: new Date() },
  });
}