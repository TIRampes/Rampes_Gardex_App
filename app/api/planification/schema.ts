import { z } from "zod";

// ╔══════════════════════════════════════════════════════════════╗
// ║   SCHEMAS ZOD — MODULE PLANIFICATION (Rampes Gardex)        ║
// ╚══════════════════════════════════════════════════════════════╝

// ──── Enums ────
export const StatutPlanificationEnum = z.enum([
  "PLANIFIEE",
  "CONFIRMEE",
  "EN_COURS",
  "COMPLETEE",
  "REPORTEE",
  "ANNULEE",
]);

export const ServiceCommandeEnum = z.enum([
  "INSTALLATION",
  "LIVRAISON",
  "CUEILLETTE",
  "TRANSPORT",
]);

export const TypeCommandeEnum = z.enum([
  "STANDARD",
  "COMMERCIAL",
  "MULTI_PHASE",
  "MULTIPLAN",
]);

// ──── Constantes visuelles ────

export const HEURES_PAR_JOUR = 8;
export const HEURES_MAX_JOURNEE = 12;

export const COULEURS_EQUIPES = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-amber-500",
] as const;

export const TYPE_COMMANDE_COLORS: Record<string, { bg: string; text: string }> = {
  STANDARD:    { bg: "bg-slate-100",  text: "text-slate-700" },
  COMMERCIAL:  { bg: "bg-purple-100", text: "text-purple-700" },
  MULTIPLAN:   { bg: "bg-blue-100",   text: "text-blue-700" },
  MULTI_PHASE: { bg: "bg-orange-100", text: "text-orange-700" },
};

export const STATUT_PLANIF_MAP: Record<string, { label: string; bg: string; text: string }> = {
  PLANIFIEE: { label: "Planifiée",  bg: "bg-blue-100",   text: "text-blue-700" },
  CONFIRMEE: { label: "Confirmée",  bg: "bg-green-100",  text: "text-green-700" },
  EN_COURS:  { label: "En cours",   bg: "bg-amber-100",  text: "text-amber-700" },
  COMPLETEE: { label: "Complétée",  bg: "bg-emerald-500", text: "text-white" },
  REPORTEE:  { label: "Reportée",   bg: "bg-orange-100", text: "text-orange-700" },
  ANNULEE:   { label: "Annulée",    bg: "bg-red-100",    text: "text-red-700" },
};

export const MOIS_NOMS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
] as const;

export const JOURS_COURTS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"] as const;
export const JOURS_LONGS = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
] as const;

// ──── Schemas de requêtes API ────

/** GET /api/planification — filtres */
export const PlanificationQuerySchema = z.object({
  type: z.enum(["tous", "installation", "mesure"]).optional().default("tous"),
  typeCommande: z.enum(["tous", "standard", "commercial", "multiplan", "multiphase"]).optional().default("tous"),
  equipeId: z.string().optional(),
  statut: z.string().optional(),
  recherche: z.string().optional(),
  nonPlanifiees: z.string().transform((v) => v === "true").optional(),
  page: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().positive()).optional().default(1),
  limite: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(1).max(200)).optional().default(500),
});

/** GET /api/planification/calendrier */
export const CalendrierPlanifQuerySchema = z.object({
  mois: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(0).max(11)),
  annee: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(2020).max(2100)),
  equipeId: z.string().optional(),
});

// ──── Schemas de mutations ────

/** POST /api/planification — créer une planification */
export const CreerPlanificationSchema = z.object({
  commandeId: z.string().cuid(),
  equipeId: z.string().cuid(),
 datePlanifiee: z
  .coerce.date()
  .refine((date) => !isNaN(date.getTime()), {
    message: "Date requise",
  }),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  heureFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  clientPresent: z.boolean().default(false),
  representantPresent: z.boolean().default(false),
  envoyerAvis: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

/** PATCH /api/planification — mettre à jour */
export const UpdatePlanificationSchema = z.object({
  planificationId: z.string().cuid(),
  equipeId: z.string().cuid().optional(),
  datePlanifiee: z
    .coerce.date()
    .refine((date) => !isNaN(date.getTime()), {
      message: "Date requise",
    })
    .optional(),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  heureFin: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  clientPresent: z.boolean().optional(),
  representantPresent: z.boolean().optional(),
  envoyerAvis: z.boolean().optional(),
  avisEnvoye: z.boolean().optional(),
  statut: StatutPlanificationEnum.optional(),
  notes: z.string().max(2000).nullable().optional(),
});

/** PUT — modifier la commande directement (date, équipe, temps) */
export const EditInstallationSchema = z.object({
  commandeId: z.string().cuid(),
  datePrevue: z.coerce.date().nullable().optional(),
  equipeId: z.string().cuid().nullable().optional(),
  tempsEstimeInstallation: z.number().int().min(0).max(500).optional(),
  heureDebut: z.string().nullable().optional(),
  heureFin: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

/** POST — terminer une installation */
export const TerminerInstallationSchema = z.object({
  commandeId: z.string().cuid(),
  planificationId: z.string().cuid().optional(),
});

/** POST — reporter une installation */
export const ReporterInstallationSchema = z.object({
  planificationId: z.string().cuid(),
  nouvelleDatePlanifiee: z.coerce.date(),
  raison: z.string().max(500).optional(),
});

// ──── Schemas équipes ────

export const CreerEquipeSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(100),
  couleur: z.string().min(1),
  membreIds: z.array(z.string().cuid()).optional(),
});

export const UpdateEquipeSchema = z.object({
  equipeId: z.string().cuid(),
  nom: z.string().min(1).max(100).optional(),
  couleur: z.string().optional(),
  actif: z.boolean().optional(),
  membreIds: z.array(z.string().cuid()).optional(),
});

// ──── Types dérivés ────
export type PlanificationQuery = z.infer<typeof PlanificationQuerySchema>;
export type CalendrierPlanifQuery = z.infer<typeof CalendrierPlanifQuerySchema>;
export type CreerPlanification = z.infer<typeof CreerPlanificationSchema>;
export type UpdatePlanification = z.infer<typeof UpdatePlanificationSchema>;
export type EditInstallation = z.infer<typeof EditInstallationSchema>;
export type CreerEquipe = z.infer<typeof CreerEquipeSchema>;
export type UpdateEquipe = z.infer<typeof UpdateEquipeSchema>;