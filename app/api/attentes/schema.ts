import { z } from "zod";

// ╔══════════════════════════════════════════════════════════════╗
// ║   SCHEMAS ZOD — MODULE ATTENTES (Rampes Gardex)             ║
// ╚══════════════════════════════════════════════════════════════╝

// ──── Constantes ────

/** Codes de production qui représentent une attente */
export const CODES_ATTENTE = [
  "ATTENTE_CLIENT",
  "ATTENTE_REPRESENTANT",
  "ATTENTE_CAROL_CONFIRM",
  "ATTENTE_CAROL_MESURE",
  "BACK_ORDER",
  "PARTIEL",
  "DOSSIER_MESUREUR",
  "MODIFICATION",
] as const;

/** Symboles d'affichage pour les codes de production */
export const CODES_DISPLAY: Record<string, { symbole: string; label: string; bg: string; text: string }> = {
  "":                      { symbole: "—",    label: "Non défini",                bg: "bg-slate-100",    text: "text-slate-400" },
  COMPLETE:                { symbole: "√",    label: "Complété",                  bg: "bg-emerald-500",  text: "text-white" },
  ATTENTE_CLIENT:          { symbole: "At.C", label: "Attente réponse client",    bg: "bg-sky-200",      text: "text-sky-800" },
  ATTENTE_REPRESENTANT:    { symbole: "At.Rep",label: "Attente réponse représ.",  bg: "bg-cyan-100",     text: "text-cyan-700" },
  NON_APPLICABLE:          { symbole: "N/A",  label: "Non applicable",            bg: "bg-slate-200",    text: "text-slate-600" },
  PARTIEL:                 { symbole: "P",    label: "Partiellement complété",    bg: "bg-blue-100",     text: "text-blue-700" },
  DOSSIER_MESUREUR:        { symbole: "D",    label: "Dossier au mesureur",       bg: "bg-indigo-100",   text: "text-indigo-700" },
  MODIFICATION:            { symbole: "M",    label: "Modification dossier",      bg: "bg-orange-100",   text: "text-orange-700" },
  ATTENTE_CAROL_CONFIRM:   { symbole: "C-C",  label: "Attente confirm. Carol",    bg: "bg-pink-100",     text: "text-pink-700" },
  ATTENTE_CAROL_MESURE:    { symbole: "C-RM", label: "Attente Carol mesures",     bg: "bg-rose-100",     text: "text-rose-700" },
  BACK_ORDER:              { symbole: "B/O",  label: "Back order",                bg: "bg-amber-100",    text: "text-amber-700" },
};

/** Mapping code attente → type d'attente */
export const CODE_TO_TYPE_ATTENTE: Record<string, string> = {
  ATTENTE_CLIENT: "client",
  ATTENTE_REPRESENTANT: "representant",
  ATTENTE_CAROL_CONFIRM: "carol",
  ATTENTE_CAROL_MESURE: "carol",
  BACK_ORDER: "back_order",
  PARTIEL: "autre",
  DOSSIER_MESUREUR: "autre",
  MODIFICATION: "autre",
};

export const TYPE_ATTENTE_LABELS: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  client:       { label: "Attente client",       bg: "bg-sky-100",    text: "text-sky-800",    icon: "👤" },
  representant: { label: "Attente représentant", bg: "bg-cyan-100",   text: "text-cyan-800",   icon: "🧑‍💼" },
  carol:        { label: "Attente Carol",        bg: "bg-pink-100",   text: "text-pink-800",   icon: "📋" },
  back_order:   { label: "Back order",           bg: "bg-amber-100",  text: "text-amber-800",  icon: "📦" },
  autre:        { label: "Autre attente",        bg: "bg-slate-100",  text: "text-slate-700",  icon: "⏳" },
};

export const SERVICE_COLORS: Record<string, { bg: string; text: string }> = {
  INSTALLATION: { bg: "bg-red-500",    text: "text-white" },
  LIVRAISON:    { bg: "bg-blue-500",   text: "text-white" },
  CUEILLETTE:   { bg: "bg-yellow-500", text: "text-yellow-900" },
  TRANSPORT:    { bg: "bg-green-500",  text: "text-white" },
};

// ──── Schemas de requêtes API ────

export const AttentesQuerySchema = z.object({
  representantIds: z.string().optional(), // comma-separated
  typeAttente: z.enum(["tous", "client", "representant", "carol", "back_order", "autre"]).optional().default("tous"),
  service: z.string().optional().default("tous"),
  recherche: z.string().optional(),
  tri: z.string().optional().default("joursEnAttente"),
  ordre: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().positive()).optional().default(1),
  limite: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(1).max(500)).optional().default(200),
});

// ──── Schemas d'envoi email ────

export const EnvoiIndividuelSchema = z.object({
  representantId: z.string().min(1),
  commandeIds: z.array(z.string()).optional(), // si vide = toutes les attentes du rep
  notes: z.string().max(2000).optional(),
});

export const EnvoiGroupeSchema = z.object({
  representantIds: z.array(z.string().min(1)).min(1),
  notes: z.string().max(2000).optional(),
});

export const EnvoiAutoConfigSchema = z.object({
  actif: z.boolean(),
  jourSemaine: z.number().int().min(0).max(6).default(1),
  heureEnvoi: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
});

// ──── Types dérivés ────
export type AttentesQuery = z.infer<typeof AttentesQuerySchema>;
export type EnvoiIndividuel = z.infer<typeof EnvoiIndividuelSchema>;
export type EnvoiGroupe = z.infer<typeof EnvoiGroupeSchema>;
export type EnvoiAutoConfig = z.infer<typeof EnvoiAutoConfigSchema>;