import { z } from 'zod';

// ╔══════════════════════════════════════════════════════╗
// ║        SCHEMAS ZOD — MODULE ACHATS                    ║
// ╚══════════════════════════════════════════════════════╝

// === ENUMS PRISMA ===
export const STATUT_ACHAT_ENUM = ['A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER'] as const;
export const TYPE_ACHAT_ENUM = ['FIBRE', 'LIMONS', 'VERRES', 'COLONNES', 'PEINTURE', 'ATTACHES', 'PLANCHER_ALUMINIUM', 'AUTRE'] as const;

// === TYPES D'ACHATS SUR UNE COMMANDE (7 inline fields) ===
export const ACHAT_TYPES = [
  { key: 'fibre', prismaStatut: 'achatFibre', prismaEnvoi: 'dateEnvoieFibre', prismaRecep: 'dateReceptionFibre', prismaQte: 'quantiteNonRecueFibre', label: 'Fibre', icone: '🧵' },
  { key: 'limons', prismaStatut: 'achatLimons', prismaEnvoi: 'dateEnvoieLimons', prismaRecep: 'dateReceptionLimons', prismaQte: 'quantiteNonRecueLimons', label: 'Limon', icone: '📐' },
  { key: 'verres', prismaStatut: 'achatVerres', prismaEnvoi: 'dateEnvoieVerres', prismaRecep: 'dateReceptionVerre', prismaQte: 'quantiteNonRecueVerres', label: 'Verre', icone: '🪟' },
  { key: 'colonnes', prismaStatut: 'achatColonnes', prismaEnvoi: 'dateEnvoieColonnes', prismaRecep: 'dateReceptionColonnes', prismaQte: 'quantiteNonRecueColonnes', label: 'Colonne', icone: '🏛️' },
  { key: 'peinture', prismaStatut: 'achatPeinture', prismaEnvoi: 'dateEnvoiePeinture', prismaRecep: 'dateReceptionPeinture', prismaQte: 'quantiteNonRecuePeinture', label: 'Peinture', icone: '🎨' },
  { key: 'attaches', prismaStatut: 'achatAttaches', prismaEnvoi: 'dateEnvoieAttaches', prismaRecep: 'dateReceptionAttaches', prismaQte: 'quantiteNonRecueAttaches', label: 'Attache', icone: '🔩' },
  { key: 'plancherAlu', prismaStatut: 'achatPlancherAluminium', prismaEnvoi: 'dateEnvoiePlancherAluminium', prismaRecep: 'dateReceptionPlancherAluminium', prismaQte: 'quantiteNonRecuePlancherAluminium', label: 'Plancher alu.', icone: '🏗️' },
] as const;

// === MAPS DE COULEURS ===
export const STATUT_ACHAT_MAP: Record<string, { symbol: string; label: string; couleur: string }> = {
  A_FAIRE:          { symbol: '①', label: 'À faire', couleur: 'bg-amber-400 text-white' },
  FAIT:             { symbol: '✓', label: 'Fait', couleur: 'bg-purple-400 text-white' },
  RECEPTIONNE:      { symbol: 'R', label: 'Réceptionné', couleur: 'bg-emerald-500 text-white' },
  PRET_A_RAMASSER:  { symbol: 'P', label: 'Prêt à ramasser', couleur: 'bg-blue-500 text-white' },
  BACK_ORDER:       { symbol: 'B/O', label: 'Back order', couleur: 'bg-red-500 text-white' },
};

export const STATUT_GLOBAL_MAP: Record<string, { label: string; couleur: string }> = {
  EN_ATTENTE:  { label: 'En attente', couleur: 'bg-amber-100 text-amber-800' },
  COMMANDEE:   { label: 'Commandée', couleur: 'bg-purple-100 text-purple-800' },
  EN_TRANSIT:  { label: 'En transit', couleur: 'bg-blue-100 text-blue-800' },
  LIVREE:      { label: 'Livrée', couleur: 'bg-emerald-100 text-emerald-800' },
};

export const SERVICE_COULEUR_MAP: Record<string, string> = {
  INSTALLATION: 'bg-red-500 text-white',
  LIVRAISON: 'bg-sky-200 text-sky-900',
  CUEILLETTE: 'bg-yellow-400 text-yellow-900',
  TRANSPORT: 'bg-slate-600 text-white',
};

// === ACHAT TYPE (un achat par type sur une commande) ===
export interface AchatTypeView {
  key: string;
  label: string;
  statut: string | null;
  dateEnvoie: string | null;
  dateReception: string | null;
  quantiteNonRecue: number | null;
  actif: boolean; // true si statut != null
}

// === VUE ENRICHIE D'UNE COMMANDE AVEC SES ACHATS ===
export interface AchatCommandeView {
  id: string;
  commandeNumero: string;
  clientNom: string;
  clientVille: string | null;
  service: string;
  couleur: string | null;
  structure: boolean;
  datePrevue: string | null;
  commentaire: string | null;
  statutLivraison: string;
  achats: AchatTypeView[];
  statutGlobal: string; // calculé: EN_ATTENTE, COMMANDEE, EN_TRANSIT, LIVREE
  nbAchatsActifs: number;
  nbAchatsRecus: number;
}

// === SCHEMA MISE À JOUR ACHATS SUR COMMANDE ===
const StatutAchatZod = z.enum(STATUT_ACHAT_ENUM).nullable().optional();
const DateZod = z.string().nullable().optional();

export const UpdateAchatsCommandeSchema = z.object({
  achatFibre: StatutAchatZod,
  dateEnvoieFibre: DateZod,
  dateReceptionFibre: DateZod,
  quantiteNonRecueFibre: z.number().int().nullable().optional(),
  achatLimons: StatutAchatZod,
  dateEnvoieLimons: DateZod,
  dateReceptionLimons: DateZod,
  quantiteNonRecueLimons: z.number().int().nullable().optional(),
  achatVerres: StatutAchatZod,
  dateEnvoieVerres: DateZod,
  dateReceptionVerre: DateZod,
  quantiteNonRecueVerres: z.number().int().nullable().optional(),
  achatColonnes: StatutAchatZod,
  dateEnvoieColonnes: DateZod,
  dateReceptionColonnes: DateZod,
  quantiteNonRecueColonnes: z.number().int().nullable().optional(),
  achatPeinture: StatutAchatZod,
  dateEnvoiePeinture: DateZod,
  dateReceptionPeinture: DateZod,
  quantiteNonRecuePeinture: z.number().int().nullable().optional(),
  achatAttaches: StatutAchatZod,
  dateEnvoieAttaches: DateZod,
  dateReceptionAttaches: DateZod,
  quantiteNonRecueAttaches: z.number().int().nullable().optional(),
  achatPlancherAluminium: StatutAchatZod,
  dateEnvoiePlancherAluminium: DateZod,
  dateReceptionPlancherAluminium: DateZod,
  quantiteNonRecuePlancherAluminium: z.number().int().nullable().optional(),
  commentaire: z.string().nullable().optional(),
});
export type UpdateAchatsCommande = z.input<typeof UpdateAchatsCommandeSchema>;

// === SCHEMA FOURNISSEUR ===
export const FournisseurCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  contact: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
  email: z.string().email('Email invalide').nullable().optional().or(z.literal('')),
  adresse: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type FournisseurCreate = z.input<typeof FournisseurCreateSchema>;

export const FournisseurUpdateSchema = FournisseurCreateSchema.partial();
export type FournisseurUpdate = z.input<typeof FournisseurUpdateSchema>;

// === STATS ===
export interface StatsAchats {
  total: number;
  aFaire: number;
  fait: number;
  enTransit: number;
  receptionne: number;
  backOrder: number;
  historiqueLivres: number;
}

// === HELPERS ===
export function getStatutAchatInfo(statut: string | null) {
  if (!statut) return null;
  return STATUT_ACHAT_MAP[statut] || { symbol: '?', label: statut, couleur: 'bg-slate-200 text-slate-700' };
}

export function getStatutGlobalInfo(statut: string) {
  return STATUT_GLOBAL_MAP[statut] || { label: statut, couleur: 'bg-slate-100 text-slate-700' };
}

export function getServiceCouleur(service: string) {
  return SERVICE_COULEUR_MAP[service] || 'bg-slate-400 text-white';
}

export function formaterDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formaterDateCourte(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-CA');
}

/** Calcule le statut global d'une commande basé sur ses achats inline */
export function calculerStatutGlobal(achats: AchatTypeView[]): string {
  const actifs = achats.filter((a) => a.actif);
  if (actifs.length === 0) return 'EN_ATTENTE';
  const tousRecus = actifs.every((a) => a.statut === 'RECEPTIONNE');
  if (tousRecus) return 'LIVREE';
  const auMoinsFait = actifs.some((a) => a.statut === 'FAIT' || a.statut === 'PRET_A_RAMASSER');
  if (auMoinsFait) return 'EN_TRANSIT';
  const auMoinsCommande = actifs.some((a) => a.statut !== 'A_FAIRE');
  if (auMoinsCommande) return 'COMMANDEE';
  return 'EN_ATTENTE';
}