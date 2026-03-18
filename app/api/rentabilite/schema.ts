import { z } from 'zod';

// ╔══════════════════════════════════════════════════════╗
// ║     TYPES & SCHEMAS — RENTABILITÉ DES INSTALLATIONS   ║
// ╚══════════════════════════════════════════════════════╝

// === LIGNE DU TABLEAU PRINCIPAL ===
export interface LigneRentabilite {
  id: string;
  numProjet: string;
  client: string;
  venteInstallation: number;
  heuresReelles: number;
  dateDebut: string | null;
  dateFin: string | null;
  // Calculés côté client
  coutInstallation: number;
  rentabilite: number;
}

// === STATS HEADER ===
export interface StatsRentabilite {
  nombreInstallations: number;
  rentabiliteSup20: number;
  moyenneRentabilite: number;
  coutHoraire: number;
}

// === RÉPONSE API ===
export interface RentabiliteResponse {
  lignes: LigneRentabilite[];
  stats: StatsRentabilite;
  coutHoraire: number;
}

// === ENTRÉE D'HEURES ===
export const EntreeHeuresSchema = z.object({
  numProjet: z.string().min(1, 'Numéro de projet requis'),
  nombreHeures: z.number().min(0.25, 'Minimum 0.25h'),
  dateInstallation: z.string().min(1, 'Date requise'),
});
export type EntreeHeures = z.input<typeof EntreeHeuresSchema>;

// === MODIFICATION D'HEURES ===
export const ModifHeuresSchema = z.object({
  commandeId: z.string(),
  nombreHeures: z.number().min(0),
  dateInstallation: z.string().optional(),
});
export type ModifHeures = z.input<typeof ModifHeuresSchema>;

// === COÛT HORAIRE ===
export const CoutHoraireSchema = z.object({
  coutHoraire: z.number().min(1),
});
export type CoutHoraire = z.input<typeof CoutHoraireSchema>;

// === FORMULES ===

/** Rentabilité % = ((venteInstallation - coûtInstallation) / venteInstallation) * 100 */
export function calculerRentabilite(venteInstallation: number, heuresReelles: number, coutHoraire: number): number {
  const coutInstallation = heuresReelles * coutHoraire;
  if (venteInstallation === 0) return 0;
  return ((venteInstallation - coutInstallation) / venteInstallation) * 100;
}

/** Coût installation = heures × coût horaire */
export function calculerCoutInstallation(heuresReelles: number, coutHoraire: number): number {
  return heuresReelles * coutHoraire;
}

/** Heures entre heureArrivee et heureDepart (HH:mm) */
export function calculerHeuresIntervention(arrivee: string | null, depart: string | null): number {
  if (!arrivee || !depart) return 0;
  const [ha, ma] = arrivee.split(':').map(Number);
  const [hd, md] = depart.split(':').map(Number);
  if (isNaN(ha) || isNaN(ma) || isNaN(hd) || isNaN(md)) return 0;
  const minutes = (hd * 60 + md) - (ha * 60 + ma);
  return minutes > 0 ? Math.round((minutes / 60) * 100) / 100 : 0;
}

// === COULEURS ===
export function getCouleurRentabilite(r: number): string {
  if (r >= 50) return 'bg-emerald-500 text-white';
  if (r >= 30) return 'bg-green-500 text-white';
  if (r >= 20) return 'bg-lime-500 text-white';
  if (r >= 10) return 'bg-yellow-500 text-yellow-900';
  if (r >= 0) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}

export function formaterDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formaterMontant(n: number): string {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}