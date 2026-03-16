// ╔══════════════════════════════════════════════════════════════╗
// ║   SERVICE — Logique métier Planification                    ║
// ╚══════════════════════════════════════════════════════════════╝

import { HEURES_PAR_JOUR, HEURES_MAX_JOURNEE, MONTH_NAMES } from "@/app/api/planification/schema";
import type {
  CommandePlanification,
  DayInfo,
  DayTotals,
  SemaineDuMois,
  StatsHebdo,
  ChargeEquipeSemaine,
  ConflitPlanification,
  FiltresPlanification,
  Equipe,
} from "@/app/types/planification";

// ══════════════════════════════════════════
// CALENDRIER
// ══════════════════════════════════════════

/** Génère la grille 42 jours (6 semaines) du calendrier pour un mois */
export function getDaysInMonth(date: Date): DayInfo[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();
  const days: DayInfo[] = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      currentMonth: false,
      date: new Date(year, month - 1, prevMonthLastDay - i),
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
  }
  return days;
}

/** Formate une Date en clé YYYY-MM-DD */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Formate en date lisible française */
export function formatDateFr(date: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** Formate en date longue */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Obtenir les semaines d'un mois donné */
export function getSemainesDuMois(date: Date): SemaineDuMois[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const semaines: SemaineDuMois[] = [];
  let currentDate = new Date(year, month, 1);
  let weekNum = 1;

  while (currentDate.getMonth() === month) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));
    if (weekEnd.getMonth() !== month) {
      weekEnd.setDate(new Date(year, month + 1, 0).getDate());
      weekEnd.setMonth(month);
    }

    semaines.push({
      num: weekNum,
      label: `Sem. ${weekNum} (${weekStart.getDate()}-${weekEnd.getDate()} ${MONTH_NAMES[month]})`,
      startDate: formatDateKey(weekStart),
      endDate: formatDateKey(weekEnd),
    });

    currentDate = new Date(weekEnd);
    currentDate.setDate(currentDate.getDate() + 1);
    weekNum++;
  }
  return semaines;
}

/** Vérifie si un jour est un weekend */
export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

// ══════════════════════════════════════════
// CALCULS INSTALLATIONS
// ══════════════════════════════════════════

/** Nombre de jours nécessaires pour une installation */
export function calculerJoursNecessaires(tempsHeures: number): number {
  if (!tempsHeures || tempsHeures <= 0) return 1;
  if (tempsHeures <= HEURES_MAX_JOURNEE) return 1;
  return Math.ceil(tempsHeures / HEURES_PAR_JOUR);
}

/** Vérifie si l'installation dépasse une journée normale (8h) mais reste sur 1 jour */
export function depasseJournee(tempsHeures: number): boolean {
  return tempsHeures > HEURES_PAR_JOUR && tempsHeures <= HEURES_MAX_JOURNEE;
}

/**
 * Vérifie si une commande multi-jours apparaît sur une date donnée.
 * Tient compte des weekends (jours non travaillés).
 */
export function commandeEstSurDate(cmd: CommandePlanification, dateKey: string): boolean {
  if (!cmd.datePrevue) return false;

  const tempsHeures = cmd.tempsEstimeInstallation || 0;
  const joursNecessaires = calculerJoursNecessaires(tempsHeures);

  if (joursNecessaires <= 1) {
    return cmd.datePrevue.split("T")[0] === dateKey;
  }

  // Multi-jours : parcourir les jours ouvrables
  const dateDebut = new Date(cmd.datePrevue);
  let joursTravailles = 0;
  const currentDate = new Date(dateDebut);

  while (joursTravailles < joursNecessaires) {
    if (!isWeekend(currentDate)) {
      if (formatDateKey(currentDate) === dateKey) return true;
      joursTravailles++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return false;
}

// ══════════════════════════════════════════
// FILTRAGE
// ══════════════════════════════════════════

/** Filtre les commandes selon les critères de planification */
export function filtrerCommandes(
  commandes: CommandePlanification[],
  filtres: FiltresPlanification
): CommandePlanification[] {
  return commandes.filter((cmd) => {
    // Type (installation / mesure)
    if (filtres.type === "installation" && cmd.service !== "INSTALLATION") return false;
    if (filtres.type === "mesure" && cmd.service !== "INSTALLATION") return false; // Mesure = sous-type d'installation

    // Type commande
    if (filtres.typeCommande !== "tous") {
      const mapping: Record<string, string> = {
        standard: "STANDARD",
        commercial: "COMMERCIAL",
        multiplan: "MULTIPLAN",
        multiphase: "MULTI_PHASE",
      };
      if (cmd.typeCommande !== mapping[filtres.typeCommande]) return false;
    }

    // Équipe
    if (filtres.equipe !== "toutes" && cmd.equipeId !== filtres.equipe) return false;

    // Recherche texte
    if (filtres.recherche) {
      const s = filtres.recherche.toLowerCase();
      const match =
        cmd.numero.toLowerCase().includes(s) ||
        cmd.clientNom.toLowerCase().includes(s) ||
        cmd.adresse.toLowerCase().includes(s) ||
        (cmd.reference?.toLowerCase().includes(s) ?? false);
      if (!match) return false;
    }

    return true;
  });
}

/** Sépare les commandes planifiées et non planifiées */
export function separerPlanifications(commandes: CommandePlanification[]) {
  const planifiees = commandes.filter(
    (c) => c.datePrevue && c.equipeId && c.statut === "ACTIVE"
  );
  const nonPlanifiees = commandes.filter(
    (c) =>
      c.statut === "ACTIVE" &&
      c.productionTerminee === "COMPLETE" &&
      (!c.equipeId || !c.datePrevue)
  );
  return { planifiees, nonPlanifiees };
}

// ══════════════════════════════════════════
// AGRÉGATION PAR DATE
// ══════════════════════════════════════════

/** Retourne les installations pour une date donnée (y compris multi-jours) */
export function getInstallationsForDate(
  planifiees: CommandePlanification[],
  date: Date,
  filtres?: FiltresPlanification
): CommandePlanification[] {
  const dateKey = formatDateKey(date);
  let result = planifiees.filter((cmd) => commandeEstSurDate(cmd, dateKey));
  if (filtres) result = filtrerCommandes(result, filtres);
  return result;
}

/** Calcule les totaux pour une date */
export function getTotalsForDate(
  planifiees: CommandePlanification[],
  date: Date,
  filtres?: FiltresPlanification
): DayTotals {
  const installations = getInstallationsForDate(planifiees, date, filtres);
  const byEquipe: DayTotals["byEquipe"] = {};

  for (const cmd of installations) {
    const key = cmd.equipeId ?? "non-assigne";
    if (!byEquipe[key]) {
      byEquipe[key] = {
        equipeNom: cmd.equipeNom ?? "Non assigné",
        couleur: cmd.equipeCouleur ?? "bg-slate-400",
        count: 0,
        heures: 0,
        piedsLin: 0,
      };
    }
    byEquipe[key].count++;
    byEquipe[key].heures += cmd.tempsEstimeInstallation || 0;
    byEquipe[key].piedsLin += cmd.piedsLineairesRampes || 0;
  }

  return {
    count: installations.length,
    tempsTotal: installations.reduce((acc, c) => acc + (c.tempsEstimeInstallation || 0), 0),
    piedsLineaires: installations.reduce((acc, c) => acc + (c.piedsLineairesRampes || 0), 0),
    poteaux: installations.reduce((acc, c) => acc + (c.nombrePoteaux || 0), 0),
    byEquipe,
  };
}

/** Groupe les commandes par dateKey pour un accès rapide */
export function grouperParDate(
  planifiees: CommandePlanification[]
): Record<string, CommandePlanification[]> {
  const map: Record<string, CommandePlanification[]> = {};
  for (const cmd of planifiees) {
    if (!cmd.datePrevue) continue;
    const key = cmd.datePrevue.split("T")[0];
    if (!map[key]) map[key] = [];
    map[key].push(cmd);
  }
  return map;
}

// ══════════════════════════════════════════
// STATS HEBDOMADAIRES
// ══════════════════════════════════════════

export function calculerStatsHebdo(
  planifiees: CommandePlanification[],
  referenceDate?: Date
): StatsHebdo {
  const now = referenceDate ?? new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const semaineData = planifiees.filter((cmd) => {
    if (!cmd.datePrevue) return false;
    const d = new Date(cmd.datePrevue);
    return d >= weekStart && d <= weekEnd;
  });

  const equipesActives = new Set(semaineData.map((c) => c.equipeId).filter(Boolean));

  return {
    nbInstallations: semaineData.filter((c) => c.service === "INSTALLATION").length,
    heuresTotal: semaineData.reduce((a, c) => a + (c.tempsEstimeInstallation || 0), 0),
    piedsTotal: semaineData.reduce((a, c) => a + (c.piedsLineairesRampes || 0), 0),
    nbDeplacements: semaineData.length,
    nbEquipesActives: equipesActives.size,
    nbMesures: semaineData.filter((c) => c.service !== "INSTALLATION").length,
  };
}

// ══════════════════════════════════════════
// CHARGE D'ÉQUIPE (ajout pro)
// ══════════════════════════════════════════

export function calculerChargeEquipe(
  equipe: Equipe,
  planifiees: CommandePlanification[],
  referenceDate?: Date
): ChargeEquipeSemaine {
  const now = referenceDate ?? new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Lundi
  weekStart.setHours(0, 0, 0, 0);

  const jours: ChargeEquipeSemaine["jours"] = [];
  const joursSemaine = ["lun", "mar", "mer", "jeu", "ven"];

  for (let i = 0; i < 5; i++) {
    const jour = new Date(weekStart);
    jour.setDate(weekStart.getDate() + i);
    const dateKey = formatDateKey(jour);

    const installsJour = planifiees.filter(
      (c) => c.equipeId === equipe.id && commandeEstSurDate(c, dateKey)
    );

    const heures = installsJour.reduce((a, c) => a + (c.tempsEstimeInstallation || 0), 0);

    jours.push({
      date: dateKey,
      jourSemaine: joursSemaine[i],
      heures,
      nbInstallations: installsJour.length,
      capaciteMax: HEURES_PAR_JOUR,
      surcharge: heures > HEURES_PAR_JOUR,
    });
  }

  const totalHeures = jours.reduce((a, j) => a + j.heures, 0);
  const totalInstallations = jours.reduce((a, j) => a + j.nbInstallations, 0);
  const capaciteSemaine = 5 * HEURES_PAR_JOUR;

  return {
    equipeId: equipe.id,
    equipeNom: equipe.nom,
    couleur: equipe.couleur,
    jours,
    totalHeures,
    totalInstallations,
    tauxOccupation: capaciteSemaine > 0 ? Math.round((totalHeures / capaciteSemaine) * 100) : 0,
  };
}

// ══════════════════════════════════════════
// DÉTECTION DE CONFLITS (ajout pro)
// ══════════════════════════════════════════

export function detecterConflits(
  planifiees: CommandePlanification[],
  equipes: Equipe[]
): ConflitPlanification[] {
  const conflits: ConflitPlanification[] = [];
  const parDateEquipe: Record<string, CommandePlanification[]> = {};

  for (const cmd of planifiees) {
    if (!cmd.datePrevue || !cmd.equipeId) continue;
    const dateKey = cmd.datePrevue.split("T")[0];
    const key = `${dateKey}__${cmd.equipeId}`;
    if (!parDateEquipe[key]) parDateEquipe[key] = [];
    parDateEquipe[key].push(cmd);
  }

  for (const [key, cmds] of Object.entries(parDateEquipe)) {
    const [dateKey, equipeId] = key.split("__");
    const equipe = equipes.find((e) => e.id === equipeId);
    const equipeNom = equipe?.nom ?? "Inconnue";
    const totalHeures = cmds.reduce((a, c) => a + (c.tempsEstimeInstallation || 0), 0);

    // Surcharge journalière
    if (totalHeures > HEURES_MAX_JOURNEE) {
      conflits.push({
        type: "SURCHARGE",
        message: `${equipeNom} a ${totalHeures}h planifiées le ${dateKey} (max ${HEURES_MAX_JOURNEE}h)`,
        date: dateKey,
        equipeNom,
        commandeIds: cmds.map((c) => c.id),
        severite: "ERROR",
      });
    } else if (totalHeures > HEURES_PAR_JOUR) {
      conflits.push({
        type: "SURCHARGE",
        message: `${equipeNom} dépasse 8h le ${dateKey} (${totalHeures}h)`,
        date: dateKey,
        equipeNom,
        commandeIds: cmds.map((c) => c.id),
        severite: "WARNING",
      });
    }
  }

  // Planifications le weekend
  for (const cmd of planifiees) {
    if (!cmd.datePrevue) continue;
    const d = new Date(cmd.datePrevue);
    if (isWeekend(d)) {
      conflits.push({
        type: "WEEKEND",
        message: `${cmd.numero} planifiée un weekend (${formatDateFr(d)})`,
        date: formatDateKey(d),
        equipeNom: cmd.equipeNom ?? "—",
        commandeIds: [cmd.id],
        severite: "INFO",
      });
    }
  }

  return conflits;
}