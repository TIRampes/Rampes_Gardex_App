import { z } from "zod";

// ╔══════════════════════════════════════════════════════════╗
// ║      SCHEMAS ZOD — MODULE PRODUCTION (Rampes Gardex)    ║
// ╚══════════════════════════════════════════════════════════╝

// ──────────────────────────────────────────
// Énumérations
// ──────────────────────────────────────────

export const CodeProductionEnum = z.enum([
  "COMPLETE",
  "ATTENTE_CLIENT",
  "NON_APPLICABLE",
  "PARTIEL",
  "DOSSIER_MESUREUR",
  "MODIFICATION",
  "ATTENTE_CAROL_CONFIRM",
  "ATTENTE_CAROL_MESURE",
  "BACK_ORDER",
  "ATTENTE_REPRESENTANT",
]);
export type CodeProduction = z.infer<typeof CodeProductionEnum>;

export const StatutProductionEnum = z.enum([
  "EN_ATTENTE",
  "EN_COURS",
  "TERMINE",
  "EN_PAUSE",
]);
export type StatutProduction = z.infer<typeof StatutProductionEnum>;

export const StatutCommandeEnum = z.enum([
  "ACTIVE",
  "EN_ATTENTE",
  "COMPLETEE",
  "ANNULEE",
]);

export const ServiceCommandeEnum = z.enum([
  "INSTALLATION",
  "LIVRAISON",
  "CUEILLETTE",
  "TRANSPORT",
]);
export type ServiceCommande = z.infer<typeof ServiceCommandeEnum>;

export const TypeCommandeEnum = z.enum([
  "STANDARD",
  "COMMERCIAL",
  "MULTI_PHASE",
  "MULTIPLAN",
]);

export const StatutAchatEnum = z.enum([
  "A_FAIRE",
  "FAIT",
  "RECEPTIONNE",
  "PRET_A_RAMASSER",
  "BACK_ORDER",
]);

export const StatutLivraisonEnum = z.enum(["N_A", "LIVRE"]);

export const CouleurEnum = z.enum([
  "NOIR",
  "BLANC",
  "BRUN_COMMERCIALE",
  "GRIS_CHARBON",
  "ARGILE",
  "SPECIALE",
  "GRIS_METALLIQUE",
  "AUTRE",
]);

// ──────────────────────────────────────────
// Mapping codes → labels & couleurs UI
// ──────────────────────────────────────────

export const CODES_PRODUCTION_MAP: Record<
  string,
  { label: string; symbole: string; bg: string; text: string }
> = {
  "":                      { label: "Non défini",                     symbole: "—",    bg: "bg-slate-100",   text: "text-slate-500" },
  COMPLETE:                { label: "Étape complétée",                symbole: "√",    bg: "bg-emerald-500", text: "text-white" },
  ATTENTE_CLIENT:          { label: "Attente réponse client",         symbole: "At.C", bg: "bg-yellow-100",  text: "text-yellow-700" },
  NON_APPLICABLE:          { label: "Non applicable",                 symbole: "N/A",  bg: "bg-slate-200",   text: "text-slate-600" },
  PARTIEL:                 { label: "Partiellement complétée",        symbole: "P",    bg: "bg-blue-100",    text: "text-blue-700" },
  DOSSIER_MESUREUR:        { label: "Dossier donné au mesureur",      symbole: "D",    bg: "bg-indigo-100",  text: "text-indigo-700" },
  MODIFICATION:            { label: "Modification d'un dossier",      symbole: "M",    bg: "bg-orange-100",  text: "text-orange-700" },
  ATTENTE_CAROL_CONFIRM:   { label: "Attente confirmation Carol",     symbole: "C-C",  bg: "bg-pink-100",    text: "text-pink-700" },
  ATTENTE_CAROL_MESURE:    { label: "Attente Carol retour mesures",   symbole: "C-RM", bg: "bg-rose-100",    text: "text-rose-700" },
  BACK_ORDER:              { label: "Commande avec back order",       symbole: "B/O",  bg: "bg-amber-100",   text: "text-amber-700" },
  ATTENTE_REPRESENTANT:    { label: "Attente réponse représentant",   symbole: "At.Rep", bg: "bg-cyan-100",  text: "text-cyan-700" },
};

export const STATUTS_ACHAT_MAP: Record<
  string,
  { label: string; symbole: string; bg: string; text: string }
> = {
  "":              { label: "Non défini",                  symbole: "—",   bg: "bg-slate-100",  text: "text-slate-500" },
  A_FAIRE:         { label: "Achat à faire",               symbole: "①",   bg: "bg-orange-100", text: "text-orange-700" },
  FAIT:            { label: "Achat fait",                   symbole: "√",   bg: "bg-blue-100",   text: "text-blue-700" },
  RECEPTIONNE:     { label: "Achat réceptionné",            symbole: "R",   bg: "bg-green-500",  text: "text-white" },
  PRET_A_RAMASSER: { label: "Prêt à ramasser",              symbole: "P",   bg: "bg-purple-100", text: "text-purple-700" },
  BACK_ORDER:      { label: "Reçu partiellement (B/O)",     symbole: "B/O", bg: "bg-amber-100",  text: "text-amber-700" },
};

export const SERVICE_COLORS: Record<
  string,
  { bg: string; text: string; border: string; rowBg: string }
> = {
  INSTALLATION: { bg: "bg-red-600",    text: "text-white",      border: "border-red-700",    rowBg: "bg-red-50" },
  LIVRAISON:    { bg: "bg-blue-500",   text: "text-white",      border: "border-blue-600",   rowBg: "bg-blue-50" },
  CUEILLETTE:   { bg: "bg-yellow-400", text: "text-yellow-900", border: "border-yellow-500", rowBg: "bg-yellow-50" },
  TRANSPORT:    { bg: "bg-green-500",  text: "text-white",      border: "border-green-600",  rowBg: "bg-green-50" },
};

// ──────────────────────────────────────────
// Schémas de requêtes API
// ──────────────────────────────────────────

/** GET /api/production — filtres */
export const ProductionQuerySchema = z.object({
  recherche: z.string().optional(),
  statut: StatutCommandeEnum.optional(),
  service: ServiceCommandeEnum.optional(),
  enProduction: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  productionTerminee: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive())
    .optional()
    .default(1),
  limite: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(500))
    .optional()
    .default(50),
});

/** GET /api/production/calendrier — plage de dates */
export const CalendrierQuerySchema = z.object({
  mois: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(0).max(11)),
  annee: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2020).max(2100)),
});

/** GET /api/production/statistiques — période */
export const StatistiquesQuerySchema = z.object({
  periode: z.enum(["journalier", "hebdomadaire", "mensuel", "annuel"]).default("hebdomadaire"),
  mois: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(0).max(11))
    .optional(),
  annee: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2020).max(2100))
    .optional(),
});

// ──────────────────────────────────────────
// Schémas de mutations
// ──────────────────────────────────────────

/** PATCH /api/production — mise à jour champs production d'une commande */
export const UpdateProductionSchema = z.object({
  commandeId: z.string().cuid(),
  mesure: CodeProductionEnum.nullable().optional(),
  mesureDonneeLe: z.coerce.date().nullable().optional(),
  plan: CodeProductionEnum.nullable().optional(),
  envoyeProduction: CodeProductionEnum.nullable().optional(),
  productionTerminee: CodeProductionEnum.nullable().optional(),
  termine: CodeProductionEnum.nullable().optional(),
  installation: CodeProductionEnum.nullable().optional(),
  statutLivraison: StatutLivraisonEnum.optional(),
  dateProduction: z.coerce.date().nullable().optional(),
  enProduction: z.boolean().optional(),
  structure: z.boolean().optional(),
});

/** POST /api/production — mettre en production (batch) */
export const MettreEnProductionSchema = z.object({
  commandeIds: z.array(z.string().cuid()).min(1, "Sélectionnez au moins une commande"),
  dateProduction: z.coerce
    .date()
    .refine((d) => d instanceof Date && !isNaN(d.getTime()), {
      message: "Date de production requise",
    }),
});

/** POST /api/production — retirer de production */
export const RetirerProductionSchema = z.object({
  commandeId: z.string().cuid(),
});

/** POST /api/production — terminer production */
export const TerminerProductionSchema = z.object({
  commandeId: z.string().cuid(),
  notes: z.string().max(1000).optional(),
});

/** Mise à jour achats depuis la vue production */
export const UpdateAchatProductionSchema = z.object({
  commandeId: z.string().cuid(),
  champ: z.enum([
    "achatFibre",
    "achatLimons",
    "achatVerres",
    "achatColonnes",
    "achatPeinture",
    "achatAttaches",
    "achatPlancherAluminium",
  ]),
  valeur: StatutAchatEnum.nullable(),
  dateEnvoie: z.coerce.date().nullable().optional(),
  dateReception: z.coerce.date().nullable().optional(),
  quantiteNonRecue: z.number().int().min(0).nullable().optional(),
});

// ──────────────────────────────────────────
// Types dérivés pour l'UI
// ──────────────────────────────────────────

export type ProductionQuery = z.infer<typeof ProductionQuerySchema>;
export type CalendrierQuery = z.infer<typeof CalendrierQuerySchema>;
export type StatistiquesQuery = z.infer<typeof StatistiquesQuerySchema>;
export type UpdateProduction = z.infer<typeof UpdateProductionSchema>;
export type MettreEnProduction = z.infer<typeof MettreEnProductionSchema>;
export type UpdateAchatProduction = z.infer<typeof UpdateAchatProductionSchema>;

/** Shape d'une commande retournée pour le module production */
export interface CommandeProduction {
  id: string;
  numero: string;
  clientNom: string;
  clientId: string;
  representantNom: string | null;
  reference: string | null;
  service: ServiceCommande;
  typeCommande: string;
  statut: string;
  adresse: string;
  couleur: string | null;
  couleurPersonnalisee: string | null;
  reprise: boolean;
  // Dates
  dateEntree: string;
  datePrevue: string | null;
  dateProduction: string | null;
  datePriseMesure: string | null;
  dateLivraison: string | null;
  // Production
  enProduction: boolean;
  structure: boolean;
  mesure: string | null;
  mesureDonneeLe: string | null;
  plan: string | null;
  envoyeProduction: string | null;
  productionTerminee: string | null;
  termine: string | null;
  installation: string | null;
  statutLivraison: string;
  // Métriques
  piedsLineairesRampes: number;
  nombrePoteaux: number;
  tempsEstimeInstallation: number;
  piedsCarresFibre: number | null;
  // Pieds détaillés
  piedsLineairesBarrotin: number;
  piedsLineairesVerre: number;
  piedsLineairesMur: number;
  piedsLineairesMainDouble: number;
  piedsLineairesGardexVision: number;
  piedsLineairesGardexUrbaine: number;
  piedsLineairesGardexOptimum: number;
  // Achats
  achatFibre: string | null;
  achatLimons: string | null;
  achatVerres: string | null;
  achatColonnes: string | null;
  achatPeinture: string | null;
  achatAttaches: string | null;
  achatPlancherAluminium: string | null;
  // Commentaire
  commentaire: string | null;
  // Équipe planifiée
  equipeNom: string | null;
  clientPresent: boolean;
}

/** Statistiques de production */
export interface StatsProduction {
  totalCommandes: number;
  piedsLineaires: number;
  poteaux: number;
  enProduction: number;
  terminees: number;
  enAttente: number;
  parJour: { date: string; commandes: number; piedsLineaires: number; poteaux: number }[];
  parService: { service: string; count: number }[];
}