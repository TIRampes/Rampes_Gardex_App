import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ╔══════════════════════════════════════════════════════════╗
// ║       QUERIES PRISMA — MODULE PRODUCTION                ║
// ╚══════════════════════════════════════════════════════════╝

const PRODUCTION_INCLUDE = {
  client: { select: { id: true, nom: true } },
  representant: { select: { id: true, nom: true } },
  planifications: {
    include: { equipe: { select: { nom: true, couleur: true } } },
    orderBy: { datePlanifiee: "desc" as const },
    take: 1,
  },
} satisfies Prisma.CommandeInclude;

/**
 * Récupère toutes les commandes actives avec les champs production
 */
export async function getCommandesProduction(options?: {
  statut?: string;
  service?: string;
  enProduction?: boolean;
  recherche?: string;
  page?: number;
  limite?: number;
}) {
  const {
    statut = "ACTIVE",
    service,
    enProduction,
    recherche,
    page = 1,
    limite = 50,
  } = options ?? {};

  const where: Prisma.CommandeWhereInput = { statut: statut as any };

  if (service) where.service = service as any;
  if (enProduction !== undefined) {
    if (enProduction) {
      where.envoyeProduction = "COMPLETE";
      where.NOT = { productionTerminee: "COMPLETE" };
    }
  }
  if (recherche) {
    where.OR = [
      { numero: { contains: recherche } },
      { client: { nom: { contains: recherche } } },
      { reference: { contains: recherche } },
    ];
  }

  const [commandes, total] = await Promise.all([
    prisma.commande.findMany({
      where,
      include: PRODUCTION_INCLUDE,
      orderBy: [{ dateProduction: "asc" }, { datePrevue: "asc" }],
      skip: (page - 1) * limite,
      take: limite,
    }),
    prisma.commande.count({ where }),
  ]);

  return { commandes, total, totalPages: Math.ceil(total / limite) };
}

/**
 * Récupère les commandes en production pour une plage de dates (calendrier)
 */
export async function getCommandesCalendrier(mois: number, annee: number) {
  const startDate = new Date(annee, mois, 1);
  const endDate = new Date(annee, mois + 1, 0, 23, 59, 59);

  return prisma.commande.findMany({
    where: {
      envoyeProduction: "COMPLETE",
      productionTerminee: { not: "COMPLETE" },
      dateProduction: { gte: startDate, lte: endDate },
    },
    include: PRODUCTION_INCLUDE,
    orderBy: { dateProduction: "asc" },
  });
}

/**
 * Compteurs globaux pour les statistiques
 */
export async function getProductionCounters() {
  const [enProduction, terminees, enAttente, totalActive] = await Promise.all([
    prisma.commande.count({
      where: { envoyeProduction: "COMPLETE", productionTerminee: { not: "COMPLETE" } },
    }),
    prisma.commande.count({
      where: { productionTerminee: "COMPLETE" },
    }),
    prisma.commande.count({
      where: { statut: "ACTIVE", envoyeProduction: { not: "COMPLETE" } },
    }),
    prisma.commande.count({ where: { statut: "ACTIVE" } }),
  ]);

  return { enProduction, terminees, enAttente, totalActive };
}

/**
 * Commandes en production pour une période donnée (stats)
 */
export async function getCommandesPeriode(dateDebut: Date, dateFin: Date) {
  return prisma.commande.findMany({
    where: {
      envoyeProduction: "COMPLETE",
      dateProduction: { gte: dateDebut, lte: dateFin },
    },
    select: {
      id: true,
      service: true,
      piedsLineairesRampes: true,
      nombrePoteaux: true,
      dateProduction: true,
      productionTerminee: true,
    },
  });
}

/**
 * Récupère une commande complète avec tous ses détails production
 */
export async function getCommandeProduction(commandeId: string) {
  return prisma.commande.findUnique({
    where: { id: commandeId },
    include: {
      ...PRODUCTION_INCLUDE,
      productions: { orderBy: { dateProduction: "desc" } },
      balcons: true,
      structuresAchat: true,
    },
  });
}