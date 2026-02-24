import { prisma } from "@/lib/prisma";
import type { CodeProduction } from "@prisma/client";

// ╔══════════════════════════════════════════════════════════╗
// ║       MUTATIONS PRISMA — MODULE PRODUCTION              ║
// ╚══════════════════════════════════════════════════════════╝

/**
 * Met à jour les champs production d'une commande
 */
export async function updateProductionFields(
  commandeId: string,
  data: {
    mesure?: CodeProduction | null;
    mesureDonneeLe?: Date | null;
    plan?: CodeProduction | null;
    envoyeProduction?: CodeProduction | null;
    productionTerminee?: CodeProduction | null;
    termine?: CodeProduction | null;
    installation?: CodeProduction | null;
    dateProduction?: Date | null;
    enProduction?: boolean;
    structure?: boolean;
  }
) {
  // Si envoyeProduction passe à COMPLETE, activer enProduction
  const updateData = { ...data };
  if (updateData.envoyeProduction === "COMPLETE") {
    updateData.enProduction = true;
  }

  return prisma.commande.update({
    where: { id: commandeId },
    data: updateData,
    include: { client: { select: { nom: true } } },
  });
}

/**
 * Met en production un lot de commandes
 */
export async function mettreEnProductionBatch(
  commandeIds: string[],
  dateProduction: Date
) {
  return prisma.$transaction(
    commandeIds.map((id) =>
      prisma.commande.update({
        where: { id },
        data: {
          envoyeProduction: "COMPLETE",
          enProduction: true,
          dateProduction,
        },
      })
    )
  );
}

/**
 * Retire une commande de la production
 */
export async function retirerDeProduction(commandeId: string) {
  return prisma.commande.update({
    where: { id: commandeId },
    data: {
      envoyeProduction: null,
      enProduction: false,
      dateProduction: null,
    },
  });
}

/**
 * Marque la production comme terminée
 */
export async function terminerProduction(
  commandeId: string,
  notes?: string
) {
  return prisma.commande.update({
    where: { id: commandeId },
    data: {
      productionTerminee: "COMPLETE",
      enProduction: false,
      ...(notes ? { commentaire: notes } : {}),
    },
  });
}

/**
 * Met à jour un champ achat d'une commande
 */
export async function updateAchatCommande(
  commandeId: string,
  champ: string,
  valeur: string | null,
  options?: {
    dateEnvoie?: Date | null;
    dateReception?: Date | null;
    quantiteNonRecue?: number | null;
  }
) {
  const champDateMap: Record<
    string,
    { envoie: string; reception: string; qte: string }
  > = {
    achatFibre:             { envoie: "dateEnvoieFibre",             reception: "dateReceptionFibre",              qte: "quantiteNonRecueFibre" },
    achatLimons:            { envoie: "dateEnvoieLimons",            reception: "dateReceptionLimons",             qte: "quantiteNonRecueLimons" },
    achatVerres:            { envoie: "dateEnvoieVerres",            reception: "dateReceptionVerres",              qte: "quantiteNonRecueVerres" },
    achatColonnes:          { envoie: "dateEnvoieColonnes",          reception: "dateReceptionColonnes",           qte: "quantiteNonRecueColonnes" },
    achatPeinture:          { envoie: "dateEnvoiePeinture",          reception: "dateReceptionPeinture",           qte: "quantiteNonRecuePeinture" },
    achatAttaches:          { envoie: "dateEnvoieAttaches",          reception: "dateReceptionAttaches",           qte: "quantiteNonRecueAttaches" },
    achatPlancherAluminium: { envoie: "dateEnvoiePlancherAluminium", reception: "dateReceptionPlancherAluminium",  qte: "quantiteNonRecuePlancherAluminium" },
  };

  const updateObj: Record<string, unknown> = { [champ]: valeur };
  const mapping = champDateMap[champ];
  if (mapping && options) {
    if (options.dateEnvoie !== undefined) updateObj[mapping.envoie] = options.dateEnvoie;
    if (options.dateReception !== undefined) updateObj[mapping.reception] = options.dateReception;
    if (options.quantiteNonRecue !== undefined) updateObj[mapping.qte] = options.quantiteNonRecue;
  }

  return prisma.commande.update({
    where: { id: commandeId },
    data: updateObj,
  });
}

/**
 * Crée un enregistrement de production (table Production)
 */
export async function creerProduction(data: {
  commandeId: string;
  dateProduction: Date;
  notes?: string;
}) {
  const d = data.dateProduction;
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const semaine = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  return prisma.production.create({
    data: {
      commandeId: data.commandeId,
      semaine,
      annee: d.getFullYear(),
      dateProduction: d,
      statut: "EN_ATTENTE",
      notes: data.notes,
    },
  });
}