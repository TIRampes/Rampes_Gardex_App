import { z } from 'zod';

// ╔══════════════════════════════════════════╗
// ║       SCHEMAS ZOD - MODULE ATTENTES      ║
// ╚══════════════════════════════════════════╝

// === CODES PRODUCTION (mapping du schema Prisma) ===
export const CODE_PRODUCTION_MAP: Record<string, { label: string; short: string }> = {
  COMPLETE:                    { label: 'Complété', short: '√' },
  ATTENTE_CLIENT:              { label: 'Attente client', short: 'At.C' },
  NON_APPLICABLE:              { label: 'Non applicable', short: 'N/A' },
  PARTIEL:                     { label: 'Partiel', short: 'P' },
  DOSSIER_MESUREUR:            { label: 'Dossier mesureur', short: 'D' },
  MODIFICATION:                { label: 'Modification', short: 'M' },
  ATTENTE_CAROL_CONFIRM:       { label: 'Attente Carol confirm.', short: 'C-C' },
  ATTENTE_CAROL_MESURE:        { label: 'Attente Carol mesure', short: 'C-RM' },
  BACK_ORDER:                  { label: 'Back Order', short: 'B/O' },
  ATTENTE_REPRESENTANT:        { label: 'Attente représentant', short: 'At.Rep' },
};

// Codes qui génèrent une attente
export const CODES_ATTENTE = ['ATTENTE_CLIENT', 'ATTENTE_REPRESENTANT', 'ATTENTE_CAROL_CONFIRM', 'ATTENTE_CAROL_MESURE'];

// === REPRESENTANT (depuis Prisma: id, nom, email, telephone, actif) ===
export const RepresentantSchema = z.object({
  id: z.string(),
  nom: z.string(),
  email: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
  actif: z.boolean().default(true),
});
export type Representant = z.infer<typeof RepresentantSchema>;

// === COMMANDE EN ATTENTE (vue enrichie) ===
export const CommandeAttenteSchema = z.object({
  id: z.string(),
  numero: z.string(),
  clientNom: z.string(),
  clientAdresse: z.string().nullable().optional(),
  clientTelephone: z.string().nullable().optional(),
  representantId: z.string().nullable(),
  representantNom: z.string().nullable(),
  dateEntree: z.string(),
  datePrevue: z.string().nullable(),
  service: z.string(),
  couleur: z.string().nullable().optional(),
  couleurPersonnalisee: z.string().nullable().optional(),
  piedsLineaires: z.number().nullable().optional(),
  commentaire: z.string().nullable().optional(),
  mesure: z.string().nullable(),
  plan: z.string().nullable(),
  envoyeProduction: z.string().nullable(),
  productionTerminee: z.string().nullable(),
  termine: z.string().nullable(),
  typeAttente: z.string().nullable(),
  etapeAttente: z.string().nullable(),
  dateDernierEnvoi: z.string().nullable(),
  attenteEnvoyee: z.boolean().default(false),
});
export type CommandeAttente = z.infer<typeof CommandeAttenteSchema>;

// === ENVOI ===
export const EnvoiAttenteFormSchema = z.object({
  representantIds: z.array(z.string()).min(1, 'Au moins un représentant'),
  notes: z.string().optional(),
});
export type EnvoiAttenteForm = z.input<typeof EnvoiAttenteFormSchema>;

// === STATS ===
export interface StatsAttentes {
  totalEnAttente: number;
  totalCommandes: number;
  pourcentageEnAttente: number;
  parRepresentant: Array<{
    representantId: string;
    nom: string;
    count: number;
    dernierEnvoi: string | null;
  }>;
  parTypeAttente: Array<{
    type: string;
    label: string;
    count: number;
    pourcentage: number;
  }>;
  parService: Array<{
    service: string;
    count: number;
  }>;
  parAnciennete: Array<{
    tranche: string;
    count: number;
  }>;
}

// === FILTRES ===
export interface FiltresAttentes {
  representantIds: string[];
  recherche: string;
}

// === HELPER: générer les initiales depuis nom ===
export function genererInitiales(nom: string | null | undefined): string {
  if (!nom || !nom.trim()) return '—';
  const parts = nom.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts.map((p) => p.charAt(0).toUpperCase()).join('.');
}

// === HELPER: code court production ===
export function codeProductionCourt(code: string | null | undefined): string {
  if (!code) return '-';
  return CODE_PRODUCTION_MAP[code]?.short || code;
}

// === HELPER: couleur du statut de production ===
export function getStatutCouleur(code: string | null | undefined): string {
  if (!code) return 'text-slate-400';
  const short = CODE_PRODUCTION_MAP[code]?.short || code;
  if (short === '√') return 'text-slate-800';
  if (short === 'N/A') return 'text-slate-500';
  if (short === 'At.C' || short === 'At.Rep') return 'bg-sky-200 text-sky-800 px-[0.5rem] py-[0.25rem] rounded';
  return 'text-slate-600';
}

// === HELPER: couleur badge service ===
export function getServiceCouleur(service: string): string {
  switch (service) {
    case 'INSTALLATION': return 'bg-red-500 text-white';
    case 'LIVRAISON': return 'bg-blue-500 text-white';
    case 'CUEILLETTE': return 'bg-yellow-500 text-yellow-900';
    case 'TRANSPORT': return 'bg-green-500 text-white';
    default: return 'bg-slate-500 text-white';
  }
}

// === HELPER: label service ===
export function getServiceLabel(service: string): string {
  return service.charAt(0) + service.slice(1).toLowerCase();
}