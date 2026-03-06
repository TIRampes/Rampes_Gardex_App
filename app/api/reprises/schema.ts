import { z } from 'zod';

// ╔══════════════════════════════════════════╗
// ║       SCHEMAS ZOD - MODULE REPRISES      ║
// ╚══════════════════════════════════════════╝

// === ENUMS PRISMA MAPPÉS ===
export const TYPE_REPRISE_MAP: Record<string, { label: string; icone: string; couleur: string }> = {
  MAUVAISE_COULEUR:          { label: 'Erreur de couleur', icone: '🎨', couleur: 'bg-pink-500 text-white' },
  QUINCAILLERIE_MANQUANTE:   { label: 'Pièce manquante', icone: '🔩', couleur: 'bg-teal-500 text-white' },
  MAIN_TROP_COURTE:          { label: 'Main trop courte', icone: '📐', couleur: 'bg-indigo-500 text-white' },
  SECTIONS_MANQUANTES:       { label: 'Sections manquantes', icone: '🧩', couleur: 'bg-violet-500 text-white' },
  MAINS_MANQUANTES:          { label: 'Mains manquantes', icone: '✋', couleur: 'bg-cyan-500 text-white' },
  POTEAUX_MANQUANTS:         { label: 'Poteaux manquants', icone: '🏗️', couleur: 'bg-emerald-600 text-white' },
  PIECES_GRAFIGNEES:         { label: 'Pièces grafignées', icone: '⚡', couleur: 'bg-amber-600 text-white' },
  ERREURS_MESURE:            { label: 'Erreur de mesure', icone: '📏', couleur: 'bg-red-500 text-white' },
  ERREURS_PRODUCTION:        { label: 'Erreur de production', icone: '🏭', couleur: 'bg-orange-500 text-white' },
  CHANGEMENT_CLIENT:         { label: 'Changement client', icone: '👤', couleur: 'bg-purple-500 text-white' },
  BARRIERE:                  { label: 'Barrière', icone: '🚧', couleur: 'bg-slate-600 text-white' },
  POTEAUX:                   { label: 'Poteaux', icone: '🔱', couleur: 'bg-blue-600 text-white' },
  DESCENTES:                 { label: 'Descentes', icone: '⬇️', couleur: 'bg-sky-500 text-white' },
  CAPSULES_MANQUANTES:       { label: 'Capsules manquantes', icone: '🔘', couleur: 'bg-rose-500 text-white' },
  MURS_INTIMITE:             { label: "Murs d'intimité", icone: '🧱', couleur: 'bg-stone-500 text-white' },
  ERREUR_LIMON:              { label: 'Erreur de limon', icone: '📐', couleur: 'bg-amber-500 text-white' },
  VERRES:                    { label: 'Verres', icone: '🪟', couleur: 'bg-blue-500 text-white' },
  AUTRE:                     { label: 'Autre', icone: '📋', couleur: 'bg-slate-400 text-white' },
};

export const STATUT_REPRISE_MAP: Record<string, { label: string; couleur: string }> = {
  PLANIFIEE:           { label: 'Planifiée', couleur: 'bg-purple-100 text-purple-800' },
  EN_COURS:            { label: 'En cours', couleur: 'bg-blue-100 text-blue-800' },
  EN_ATTENTE_PIECES:   { label: 'En attente de pièces', couleur: 'bg-amber-100 text-amber-800' },
  COMPLETEE:           { label: 'Complétée', couleur: 'bg-emerald-100 text-emerald-800' },
};

export const PRIORITE_MAP: Record<string, { label: string; couleur: string }> = {
  HAUTE:   { label: 'Haute', couleur: 'bg-red-100 text-red-800 border-red-300' },
  MOYENNE: { label: 'Moyenne', couleur: 'bg-amber-100 text-amber-800 border-amber-300' },
  BASSE:   { label: 'Basse', couleur: 'bg-green-100 text-green-800 border-green-300' },
};

// === REPRISE ENRICHIE (vue pour le frontend) ===
export const RepriseSchema = z.object({
  id: z.string(),
  commandeId: z.string(),
  commandeNumero: z.string(),
  clientId: z.string(),
  clientNom: z.string(),
  clientVille: z.string().nullable().optional(),
  clientTelephone: z.string().nullable().optional(),
  commandeAdresse: z.string().nullable().optional(),
  commandeService: z.string().nullable().optional(),
  commandeCouleur: z.string().nullable().optional(),
  commandeCommentaire: z.string().nullable().optional(),
  representantNom: z.string().nullable().optional(),
  typeReprise: z.string(),
  raison: z.string(),
  dateReprise: z.string(),
  dateOrigine: z.string().nullable(),
  dateCompletion: z.string().nullable(),
  nombreReprises: z.number().int().default(1),
  tempsEstime: z.number().int().nullable().optional(),
  statut: z.string(),
  priorite: z.string(),
  responsable: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  completee: z.boolean().default(false),
});
export type RepriseView = z.infer<typeof RepriseSchema>;

// === FORMULAIRE MODIFICATION ===
export const RepriseUpdateSchema = z.object({
  typeReprise: z.string().optional(),
  raison: z.string().optional(),
  dateReprise: z.string().optional(),
  dateOrigine: z.string().optional(),
  nombreReprises: z.number().int().optional(),
  tempsEstime: z.number().int().nullable().optional(),
  statut: z.string().optional(),
  priorite: z.string().optional(),
  responsable: z.string().optional(),
  notes: z.string().optional(),
});
export type RepriseUpdate = z.input<typeof RepriseUpdateSchema>;

// === STATS ===
export interface StatsReprises {
  totalActives: number;
  totalHistorique: number;
  totalToutes: number;
  commandesMultiReprises: number;
  parType: Array<{ type: string; label: string; count: number; pourcentage: number }>;
  parPeriode: { jour: number; semaine: number; mois: number; annee: number };
}

// === FILTRES STATS ===
export const StatsFiltreSchema = z.object({
  periode: z.enum(['semaine', 'mois', 'annee']).optional(),
  annee: z.number().int().optional(),
  mois: z.number().int().optional(),
});
export type StatsFiltre = z.input<typeof StatsFiltreSchema>;

// === HELPERS ===
export function getTypeInfo(type: string) {
  return TYPE_REPRISE_MAP[type] || { label: type, icone: '📋', couleur: 'bg-slate-400 text-white' };
}

export function getStatutInfo(statut: string) {
  return STATUT_REPRISE_MAP[statut] || { label: statut, couleur: 'bg-slate-100 text-slate-700' };
}

export function getPrioriteInfo(priorite: string) {
  return PRIORITE_MAP[priorite] || { label: priorite, couleur: 'bg-slate-100 text-slate-700' };
}

export function formaterDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formaterDateCourte(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-CA');
}