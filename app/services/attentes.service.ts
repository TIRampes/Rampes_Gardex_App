// ╔══════════════════════════════════════════════════════════════╗
// ║   SERVICE MÉTIER — Attentes (Rampes Gardex)                 ║
// ╚══════════════════════════════════════════════════════════════╝

import {
  CODES_ATTENTE,
  CODE_TO_TYPE_ATTENTE,
  CODES_DISPLAY,
  TYPE_ATTENTE_LABELS,
} from "@/app/api/attentes/schema";
import type {
  CommandeAttente,
  FiltresAttentes,
  StatsAttentes,
  TypeAttenteLabel,
  ChampAttente,
} from "@/app/types/attentes";

// ──── Champs de production vérifiés pour une attente ────
const CHAMPS_PRODUCTION: ChampAttente[] = [
  "mesure",
  "plan",
  "envoyeProduction",
  "productionTerminee",
];

// ══════════════════════════════════════════
// DÉTECTION D'ATTENTE
// ══════════════════════════════════════════

/** Vérifie si un code de production est un code d'attente */
export function estCodeAttente(code: string | null): boolean {
  if (!code) return false;
  return (CODES_ATTENTE as readonly string[]).includes(code);
}

/** Extrait tous les champs en attente d'une commande */
export function extraireChampsEnAttente(
  cmd: Record<string, unknown>
): { champ: ChampAttente; code: string }[] {
  const result: { champ: ChampAttente; code: string }[] = [];
  for (const champ of CHAMPS_PRODUCTION) {
    const val = cmd[champ] as string | null;
    if (estCodeAttente(val)) {
      result.push({ champ, code: val! });
    }
  }
  return result;
}

/** Détermine le type d'attente principal */
export function determinerTypeAttente(
  champsEnAttente: { champ: ChampAttente; code: string }[]
): TypeAttenteLabel {
  if (champsEnAttente.length === 0) return "autre";

  // Priorité : client > representant > carol > back_order > autre
  const types = champsEnAttente.map((c) => CODE_TO_TYPE_ATTENTE[c.code] ?? "autre");
  if (types.includes("client")) return "client";
  if (types.includes("representant")) return "representant";
  if (types.includes("carol")) return "carol";
  if (types.includes("back_order")) return "back_order";
  return "autre";
}

// ══════════════════════════════════════════
// CALCUL D'ANCIENNETÉ
// ══════════════════════════════════════════

/** Calcul du nombre de jours depuis une date */
export function joursDepuis(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Calcul du nombre de jours en attente (depuis dateEntree) */
export function joursEnAttente(dateEntree: string): number {
  return joursDepuis(dateEntree) ?? 0;
}

/** Catégorisation par ancienneté */
export function categoriserAnciennete(jours: number): string {
  if (jours <= 7) return "< 1 semaine";
  if (jours <= 30) return "1-4 semaines";
  if (jours <= 90) return "1-3 mois";
  if (jours <= 180) return "3-6 mois";
  if (jours <= 365) return "6-12 mois";
  return "> 1 an";
}

/** Couleur d'ancienneté (urgence croissante) */
export function couleurAnciennete(jours: number): { bg: string; text: string } {
  if (jours <= 30) return { bg: "bg-green-100", text: "text-green-700" };
  if (jours <= 90) return { bg: "bg-blue-100", text: "text-blue-700" };
  if (jours <= 180) return { bg: "bg-amber-100", text: "text-amber-700" };
  if (jours <= 365) return { bg: "bg-orange-100", text: "text-orange-700" };
  return { bg: "bg-red-100", text: "text-red-700" };
}

// ══════════════════════════════════════════
// FILTRAGE
// ══════════════════════════════════════════

export function filtrerAttentes(
  commandes: CommandeAttente[],
  filtres: FiltresAttentes
): CommandeAttente[] {
  let result = [...commandes];

  // Par représentant
  if (filtres.representantIds.length > 0) {
    result = result.filter((c) =>
      filtres.representantIds.includes(c.representantId)
    );
  }

  // Par type d'attente
  if (filtres.typeAttente !== "tous") {
    result = result.filter((c) => c.typeAttente === filtres.typeAttente);
  }

  // Par service
  if (filtres.service && filtres.service !== "tous") {
    result = result.filter(
      (c) => c.service.toLowerCase() === filtres.service.toLowerCase()
    );
  }

  // Recherche texte
  if (filtres.recherche) {
    const s = filtres.recherche.toLowerCase();
    result = result.filter(
      (c) =>
        c.numero.toLowerCase().includes(s) ||
        c.clientNom.toLowerCase().includes(s) ||
        c.adresse.toLowerCase().includes(s) ||
        (c.reference?.toLowerCase().includes(s) ?? false) ||
        (c.notes?.toLowerCase().includes(s) ?? false)
    );
  }

  // Par ancienneté minimum
  if (filtres.ancienneteMin != null) {
    result = result.filter((c) => c.joursEnAttente >= filtres.ancienneteMin!);
  }

  // Tri
 result.sort((a, b) => {
  const { champ, ordre } = filtres.tri;

  const va = a[champ as keyof typeof a];
  const vb = b[champ as keyof typeof b];

  if (typeof va === "string" && typeof vb === "string") {
    return ordre === "asc"
      ? va.localeCompare(vb)
      : vb.localeCompare(va);
  }

  const na = Number(va);
  const nb = Number(vb);

  return ordre === "asc" ? na - nb : nb - na;
});

return result;
}

// ══════════════════════════════════════════
// STATISTIQUES
// ══════════════════════════════════════════

export function calculerStatsAttentes(
  commandes: CommandeAttente[],
  totalCommandes: number
): Omit<StatsAttentes, "prochainEnvoiAuto" | "envoisCetteSemaine"> {
  // Par représentant
  const repMap = new Map<string, StatsAttentes["parRepresentant"][0]>();
  for (const cmd of commandes) {
    const existing = repMap.get(cmd.representantId);
    if (!existing) {
      repMap.set(cmd.representantId, {
        representantId: cmd.representantId,
        initiales: cmd.representantInitiales,
        nom: cmd.representantNom,
        count: 1,
        dernierEnvoi: cmd.dernierEnvoi?.dateEnvoi ?? null,
      });
    } else {
      existing.count++;
      // Garder le dernier envoi le plus récent
      if (cmd.dernierEnvoi?.dateEnvoi && (!existing.dernierEnvoi || cmd.dernierEnvoi.dateEnvoi > existing.dernierEnvoi)) {
        existing.dernierEnvoi = cmd.dernierEnvoi.dateEnvoi;
      }
    }
  }

  // Par type d'attente
  const typeMap = new Map<string, number>();
  for (const cmd of commandes) {
    typeMap.set(cmd.typeAttente, (typeMap.get(cmd.typeAttente) ?? 0) + 1);
  }
  const parTypeAttente = Array.from(typeMap.entries()).map(([type, count]) => ({
    type: type as TypeAttenteLabel,
    label: TYPE_ATTENTE_LABELS[type]?.label ?? type,
    count,
    pourcentage: commandes.length > 0 ? Math.round((count / commandes.length) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // Par ancienneté
  const ancMap = new Map<string, number>();
  for (const cmd of commandes) {
    const tranche = categoriserAnciennete(cmd.joursEnAttente);
    ancMap.set(tranche, (ancMap.get(tranche) ?? 0) + 1);
  }
  const tranches = ["< 1 semaine", "1-4 semaines", "1-3 mois", "3-6 mois", "6-12 mois", "> 1 an"];
  const parAnciennete = tranches
    .filter((t) => ancMap.has(t))
    .map((tranche) => ({ tranche, count: ancMap.get(tranche)! }));

  // Par service
  const svcMap = new Map<string, number>();
  for (const cmd of commandes) {
    svcMap.set(cmd.service, (svcMap.get(cmd.service) ?? 0) + 1);
  }
  const parService = Array.from(svcMap.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEnAttente: commandes.length,
    totalCommandes,
    pourcentageEnAttente:
      totalCommandes > 0 ? Math.round((commandes.length / totalCommandes) * 100) : 0,
    parRepresentant: Array.from(repMap.values()).sort((a, b) => b.count - a.count),
    parTypeAttente,
    parAnciennete,
    parService,
  };
}

// ══════════════════════════════════════════
// UTILITAIRES AFFICHAGE
// ══════════════════════════════════════════

export function getCodeDisplay(code: string | null) {
  return CODES_DISPLAY[code ?? ""] ?? CODES_DISPLAY[""];
}

export function formatDateFr(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-CA");
}

export function formatDateRelative(date: string | null): string {
  if (!date) return "Jamais";
  const jours = joursDepuis(date);
  if (jours === null) return "—";
  if (jours === 0) return "Aujourd'hui";
  if (jours === 1) return "Hier";
  if (jours < 7) return `Il y a ${jours} jours`;
  if (jours < 30) return `Il y a ${Math.floor(jours / 7)} sem.`;
  if (jours < 365) return `Il y a ${Math.floor(jours / 30)} mois`;
  return `Il y a ${Math.floor(jours / 365)} an(s)`;
}