import { z } from 'zod';

// ╔══════════════════════════════════════════════════════╗
// ║      SCHEMAS ZOD — MODULE PLANIFICATION                ║
// ╚══════════════════════════════════════════════════════╝

export const STATUT_PLANIF_ENUM = ['PLANIFIEE', 'CONFIRMEE', 'EN_COURS', 'COMPLETEE', 'REPORTEE', 'ANNULEE'] as const;
export const HEURES_PAR_JOUR = 8;
export const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const DAY_NAMES_SHORT = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
export const HEURES_MAX_JOURNEE = 12; // 12h max pour les interventions

export const STATUT_PLANIF_MAP: Record<string, { label: string; couleur: string }> = {
  PLANIFIEE: { label: 'Planifiée', couleur: 'bg-purple-100 text-purple-800' },
  CONFIRMEE: { label: 'Confirmée', couleur: 'bg-blue-100 text-blue-800' },
  EN_COURS: { label: 'En cours', couleur: 'bg-amber-100 text-amber-800' },
  COMPLETEE: { label: 'Complétée', couleur: 'bg-emerald-100 text-emerald-800' },
  REPORTEE: { label: 'Reportée', couleur: 'bg-orange-100 text-orange-800' },
  ANNULEE: { label: 'Annulée', couleur: 'bg-red-100 text-red-800' },
};
export const SERVICE_COULEUR: Record<string, string> = {
  INSTALLATION: 'bg-red-600',
  CUEILLETTE: 'bg-yellow-500',
  LIVRAISON: 'bg-blue-600',
  TRANSPORT: 'bg-green-600',
};
export const TYPE_COMMANDE_COULEUR: Record<string, string> = {
  STANDARD: 'bg-slate-100 text-slate-700',
  COMMERCIAL: 'bg-purple-100 text-purple-700',
  MULTIPLAN: 'bg-blue-100 text-blue-700',
  MULTI_PHASE: 'bg-orange-100 text-orange-700',
};

export const STATUS_PROD_COULEUR: Record<string, string> = {
  COMPLETE: 'bg-green-500 text-white',
  ATTENTE_CLIENT: 'bg-orange-400 text-white',
  NON_APPLICABLE: 'bg-slate-300 text-slate-600',
  PARTIEL: 'bg-blue-400 text-white',
  BACK_ORDER: 'bg-red-500 text-white',
};

export const STATUT_ACHAT_COULEUR: Record<string, string> = {
  A_FAIRE: 'bg-slate-200 text-slate-600',
  FAIT: 'bg-green-500 text-white',
  RECEPTIONNE: 'bg-emerald-500 text-white',
  PRET_A_RAMASSER: 'bg-blue-500 text-white',
  BACK_ORDER: 'bg-red-500 text-white',
};

// === VUE PLANIFICATION ENRICHIE ===
export interface PlanificationView {
  id: string;
  commandeId: string;
  commandeNumero: string;
  clientNom: string;
  clientVille: string | null;
  clientTelephone: string | null;
  adresse: string;
  reference: string | null;
  typeCommande: string;
  service: string;
  couleur: string | null;
  reprise: boolean;
  commentaire: string | null;
  dateEntree: string;
  datePlanifiee: string;
  heureDebut: string | null;
  heureFin: string | null;
  statut: string;
  equipeId: string;
  equipeNom: string;
  equipeCouleur: string;
  clientPresent: boolean;
  representantPresent: boolean;
  envoyerAvis: boolean;
  avisEnvoye: boolean;
  notes: string | null;
  // Données commande
  tempsEstimeInstallation: number;
  piedsLineaires: number;
  mesure: string | null;
  plan: string | null;
  envoyeProduction: string | null;
  productionTerminee: string | null;
  // Achats inline
  achatVerres: string | null;
  achatLimons: string | null;
  achatPeinture: string | null;
  achatColonnes: string | null;
  achatFibre: string | null;
  achatAttaches: string | null;
  achatPlancherAluminium: string | null;
}

// Commande non planifiée (prod terminée mais pas de planif)
export interface CommandeNonPlanifiee {
  id: string;
  numero: string;
  clientNom: string;
  clientVille: string | null;
  adresse: string;
  typeCommande: string;
  service: string;
  tempsEstimeInstallation: number;
  piedsLineaires: number;
  couleur: string | null;
  datePrevue: Date | null;
}

export interface EquipeView {
  id: string;
  nom: string;
  couleur: string;
  actif: boolean;
  membres: Array<{ id: string; nom: string; prenom: string }>;
  nbPlanifications: number;
  heuresTotal: number;
}

export interface StatsPlanification {
  nbPlanifiees: number;
  heuresTotal: number;
  piedsTotal: number;
  nbNonPlanifiees: number;
}

// === ZOD SCHEMAS ===
export const PlanificationCreateSchema = z.object({
  commandeId: z.string().min(1),
  equipeId: z.string().min(1),
  datePlanifiee: z.string().min(1, 'Date requise'),
  heureDebut: z.string().nullable().optional(),
  heureFin: z.string().nullable().optional(),
  clientPresent: z.boolean().default(false),
  representantPresent: z.boolean().default(false),
  envoyerAvis: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});
export type PlanificationCreate = z.input<typeof PlanificationCreateSchema>;

export const PlanificationUpdateSchema = PlanificationCreateSchema.partial().extend({
  statut: z.enum(STATUT_PLANIF_ENUM).optional(),
  avisEnvoye: z.boolean().optional(),
});
export type PlanificationUpdate = z.input<typeof PlanificationUpdateSchema>;

export const EquipeCreateSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  couleur: z.string().default('bg-blue-500'),
});
export type EquipeCreate = z.input<typeof EquipeCreateSchema>;

// === HELPERS ===
export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calculerJoursNecessaires(heures: number): number {
  if (!heures || heures <= 0) return 1;
  if (heures <= 12) return 1;
  return Math.ceil(heures / HEURES_PAR_JOUR);
}

export function depasseJournee(heures: number): boolean {
  return heures > HEURES_PAR_JOUR && heures <= 12;
}

export function getProdStatusColor(val: string | null): string {
  return val ? (STATUS_PROD_COULEUR[val] || 'bg-slate-200 text-slate-600') : 'bg-slate-100 text-slate-400';
}

export function getAchatStatusColor(val: string | null): string {
  return val ? (STATUT_ACHAT_COULEUR[val] || 'bg-slate-200 text-slate-600') : 'bg-slate-100 text-slate-400';
}

export function getSymbol(val: string | null): string {
  if (!val) return '—';
  const map: Record<string, string> = {
    COMPLETE: '√', ATTENTE_CLIENT: 'At.C', NON_APPLICABLE: 'N/A', PARTIEL: 'P',
    BACK_ORDER: 'B/O', A_FAIRE: '①', FAIT: '✓', RECEPTIONNE: 'R', PRET_A_RAMASSER: 'P',
  };
  return map[val] || val;
}

export function getDaysInMonth(date: Date): Array<{ day: number; currentMonth: boolean; date: Date }> {
  const y = date.getFullYear(), m = date.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const days: Array<{ day: number; currentMonth: boolean; date: Date }> = [];
  const prevLast = new Date(y, m, 0).getDate();
  for (let i = firstDay.getDay() - 1; i >= 0; i--) days.push({ day: prevLast - i, currentMonth: false, date: new Date(y, m - 1, prevLast - i) });
  for (let i = 1; i <= lastDay.getDate(); i++) days.push({ day: i, currentMonth: true, date: new Date(y, m, i) });
  const rem = 42 - days.length;
  for (let i = 1; i <= rem; i++) days.push({ day: i, currentMonth: false, date: new Date(y, m + 1, i) });
  return days;
}

export function getWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // On décale pour que le jeudi soit dans la semaine
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getFullYear(), week: weekNumber };
}