import { z } from 'zod';

// ╔══════════════════════════════════════════════════════╗
// ║      SCHEMAS ZOD — MODULE INTERVENTIONS               ║
// ╚══════════════════════════════════════════════════════╝

// === ENUMS PRISMA ===
export const TYPE_INTERVENTION_ENUM = ['INSTALLATION', 'LIVRAISON', 'CUEILLETTE', 'TRANSPORT'] as const;
export const STATUT_INTERVENTION_ENUM = ['PLANIFIEE', 'EN_COURS', 'COMPLETEE', 'REPORTEE', 'ANNULEE'] as const;
export const TYPE_PHOTO_ENUM = ['AVANT', 'APRES', 'PREUVE', 'AUTRE'] as const;

// === COULEURS PAR TYPE ===
export const TYPE_CONFIG: Record<string, { label: string; couleur: string; border: string; headerBg: string; icone: string }> = {
  INSTALLATION: { label: 'Installation', couleur: 'bg-red-500 text-white', border: 'border-l-red-500', headerBg: 'bg-red-600', icone: '🔧' },
  LIVRAISON: { label: 'Livraison', couleur: 'bg-blue-500 text-white', border: 'border-l-blue-500', headerBg: 'bg-blue-600', icone: '🚚' },
  CUEILLETTE: { label: 'Cueillette', couleur: 'bg-yellow-500 text-yellow-900', border: 'border-l-yellow-500', headerBg: 'bg-yellow-500', icone: '📦' },
  TRANSPORT: { label: 'Transport', couleur: 'bg-green-500 text-white', border: 'border-l-green-500', headerBg: 'bg-green-600', icone: '🚛' },
};

export const STATUT_CONFIG: Record<string, { label: string; couleur: string }> = {
  PLANIFIEE: { label: 'Planifiée', couleur: 'bg-purple-100 text-purple-800' },
  EN_COURS: { label: 'En cours', couleur: 'bg-blue-100 text-blue-800' },
  COMPLETEE: { label: 'Complétée', couleur: 'bg-emerald-100 text-emerald-800' },
  REPORTEE: { label: 'Reportée', couleur: 'bg-amber-100 text-amber-800' },
  ANNULEE: { label: 'Annulée', couleur: 'bg-red-100 text-red-800' },
};

// === VUE INTERVENTION ENRICHIE ===
export interface PhotoView {
  id: string;
  type: string;
  url: string;
  description: string | null;
  createdAt: string;
}

export interface InterventionView {
  id: string;
  commandeId: string;
  commandeNumero: string;
  clientNom: string;
  clientVille: string | null;
  clientTelephone: string | null;
  adresse: string;
  type: string;
  datePrevue: string;
  heureDebut: string | null;
  heureFin: string | null;
  statut: string;
  equipeNom: string | null;
  equipeCouleur: string | null;
  responsableNom: string | null;
  formulaireComplete: boolean;
  notes: string | null;
  // Champs formulaire communs
  heureArrivee: string | null;
  heureDepart: string | null;
  personneRessource: string | null;
  telephone: string | null;
  // Installation
  accessibiliteBalcon: string | null;
  balconEncombre: string | null;
  niveauBalconConforme: string | null;
  backingConforme: string | null;
  colonneCapage: string | null;
  noteAvant: string | null;
  travauxNonComplete: boolean;
  travauxNonCompleteNote: string | null;
  mainsInstallees: string | null;
  cacheVisInstallees: string | null;
  capsulesPoteaux: string | null;
  vuEnsemble: string | null;
  noteApres: string | null;
  // Livraison
  materielComplet: string | null;
  etatMateriel: string | null;
  quantiteConforme: string | null;
  emplacementLivraison: string | null;
  accessibilite: string | null;
  noteLivraison: string | null;
  // Cueillette
  materielIdentifie: string | null;
  etatMaterielRecupere: string | null;
  quantiteRecuperee: number | null;
  emplacementCueillette: string | null;
  difficulteAcces: string | null;
  noteCueillette: string | null;
  listeMateriels: any;
  // Transport
  adresseDepart: string | null;
  adresseArrivee: string | null;
  vehiculeInspecte: string | null;
  chargementSecurise: string | null;
  documentationComplete: string | null;
  kmDepart: number | null;
  kmArrivee: number | null;
  membresEquipe: any;
  materielTransporte: string | null;
  noteTransport: string | null;
  // Signatures
  signatureInstallateur: string | null;
  signatureClient: string | null;
  signatureLivreur: string | null;
  signatureChauffeur: string | null;
  dateSignature: string | null;
  // Photos
  photos: PhotoView[];
  // Commande info
  tempsEstimeInstallation: number;
  couleur: string | null;
  mesure: string | null;
  plan: string | null;
  productionTerminee: string | null;
}

// === ZOD: FORMULAIRE SAUVEGARDE ===
const Opt = z.string().nullable().optional();

export const InterventionUpdateSchema = z.object({
  statut: z.enum(STATUT_INTERVENTION_ENUM).optional(),
  heureArrivee: Opt, heureDepart: Opt,
  personneRessource: Opt, telephone: Opt,
  // Installation
  accessibiliteBalcon: Opt, balconEncombre: Opt, niveauBalconConforme: Opt, backingConforme: Opt, colonneCapage: Opt,
  noteAvant: Opt, travauxNonComplete: z.boolean().optional(), travauxNonCompleteNote: Opt,
  mainsInstallees: Opt, cacheVisInstallees: Opt, capsulesPoteaux: Opt, vuEnsemble: Opt, noteApres: Opt,
  // Livraison
  materielComplet: Opt, etatMateriel: Opt, quantiteConforme: Opt,
  emplacementLivraison: Opt, accessibilite: Opt, noteLivraison: Opt,
  // Cueillette
  materielIdentifie: Opt, etatMaterielRecupere: Opt, quantiteRecuperee: z.number().int().nullable().optional(),
  emplacementCueillette: Opt, difficulteAcces: Opt, noteCueillette: Opt, listeMateriels: z.any().optional(),
  // Transport
  adresseDepart: Opt, adresseArrivee: Opt, vehiculeInspecte: Opt, chargementSecurise: Opt, documentationComplete: Opt,
  kmDepart: z.number().int().nullable().optional(), kmArrivee: z.number().int().nullable().optional(),
  membresEquipe: z.any().optional(), materielTransporte: Opt, noteTransport: Opt,
  // Signatures (base64 LongText)
  signatureInstallateur: Opt, signatureClient: Opt, signatureLivreur: Opt, signatureChauffeur: Opt,
  dateSignature: Opt,
  formulaireComplete: z.boolean().optional(),
  notes: Opt,
});
export type InterventionUpdate = z.input<typeof InterventionUpdateSchema>;

// === STATS ===
export interface StatsInterventions {
  total: number;
  installations: number;
  livraisons: number;
  cueillettes: number;
  transports: number;
  completees: number;
  heuresEstimees: number;
}

// === HELPERS ===
export function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || { label: type, couleur: 'bg-slate-500 text-white', border: 'border-l-slate-500', headerBg: 'bg-slate-600', icone: '📋' };
}

export function getStatutConfig(statut: string) {
  return STATUT_CONFIG[statut] || { label: statut, couleur: 'bg-slate-100 text-slate-700' };
}

export function formaterDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formaterDateCourte(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-CA');
}