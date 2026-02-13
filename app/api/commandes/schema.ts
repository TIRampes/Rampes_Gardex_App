import { z } from "zod";

// Enums
export const TypeCommande = z.enum(["STANDARD", "COMMERCIAL", "MULTI_PHASE", "MULTIPLAN"]);
export const ServiceCommande = z.enum(["INSTALLATION", "LIVRAISON", "CUEILLETTE", "TRANSPORT", "MESURE"]);
export const StatutCommande = z.enum(["ACTIVE", "EN_ATTENTE", "COMPLETEE", "ANNULEE"]);
export const TypeActivite = z.enum(["INSTALLATION", "LIVRAISON", "CUEILLETTE", "TRANSPORT"]);

export const CodeProduction = z.enum([
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

export const StatutAchat = z.enum([
  "A_FAIRE",
  "FAIT",
  "RECEPTIONNE",
  "PRET_A_RAMASSER",
  "BACK_ORDER",
]);

export const AvertissementClient = z.enum([
  "CONF_REP",
  "CONF_CLIENT",
  "ATT_REP_CLIENT",
]);

export const AvertissementMesure = z.enum([
  "PRESENCE_CLIENT",
  "PRESENCE_REPRESENTANT",
]);

// Mapping des codes de production vers symboles
export const CODE_PRODUCTION_SYMBOLS: Record<string, { symbol: string; label: string; color: string }> = {
  COMPLETE: { symbol: "✓", label: "Complété", color: "text-green-600 bg-green-100" },
  ATTENTE_CLIENT: { symbol: "At.C", label: "Attente client", color: "text-orange-600 bg-orange-100" },
  NON_APPLICABLE: { symbol: "N/A", label: "Non applicable", color: "text-gray-500 bg-gray-100" },
  PARTIEL: { symbol: "P", label: "Partiel", color: "text-blue-600 bg-blue-100" },
  DOSSIER_MESUREUR: { symbol: "D", label: "Dossier mesureur", color: "text-purple-600 bg-purple-100" },
  MODIFICATION: { symbol: "M", label: "Modification", color: "text-yellow-600 bg-yellow-100" },
  ATTENTE_CAROL_CONFIRM: { symbol: "C-C", label: "Attente Carol confirmation", color: "text-pink-600 bg-pink-100" },
  ATTENTE_CAROL_MESURE: { symbol: "C-RM", label: "Attente Carol mesure", color: "text-pink-600 bg-pink-100" },
  BACK_ORDER: { symbol: "B/O", label: "Back order", color: "text-red-600 bg-red-100" },
  ATTENTE_REPRESENTANT: { symbol: "At.Rep", label: "Attente représentant", color: "text-indigo-600 bg-indigo-100" },
};

// Mapping des statuts d'achat vers symboles
export const STATUT_ACHAT_SYMBOLS: Record<string, { symbol: string; label: string; color: string }> = {
  A_FAIRE: { symbol: "①", label: "À faire", color: "text-gray-600 bg-gray-100" },
  FAIT: { symbol: "✓", label: "Fait", color: "text-green-600 bg-green-100" },
  RECEPTIONNE: { symbol: "R", label: "Réceptionné", color: "text-blue-600 bg-blue-100" },
  PRET_A_RAMASSER: { symbol: "P", label: "Prêt à ramasser", color: "text-purple-600 bg-purple-100" },
  BACK_ORDER: { symbol: "B/O", label: "Back order", color: "text-red-600 bg-red-100" },
};

// Mapping des avertissements client
export const AVERTISSEMENT_CLIENT_SYMBOLS: Record<string, { symbol: string; label: string; color: string }> = {
  CONF_REP: { symbol: "Conf.Rep", label: "Confirmé par représentant", color: "text-green-600 bg-green-100" },
  CONF_CLIENT: { symbol: "Conf.Client", label: "Confirmé par client", color: "text-blue-600 bg-blue-100" },
  ATT_REP_CLIENT: { symbol: "Att.Rep.Client", label: "Attente réponse", color: "text-orange-600 bg-orange-100" },
};

// Mapping des avertissements mesure
export const AVERTISSEMENT_MESURE_SYMBOLS: Record<string, { symbol: string; label: string; color: string }> = {
  PRESENCE_CLIENT: { symbol: "👤", label: "Présence client requise", color: "text-blue-600 bg-blue-100" },
  PRESENCE_REPRESENTANT: { symbol: "👔", label: "Présence représentant requise", color: "text-purple-600 bg-purple-100" },
};

// Schema pour les balcons/phases
export const balconSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  numeroPhase: z.number().optional(),
  piedsLineaires: z.number().default(0),
  poteaux: z.number().default(0),
  coutBalcon: z.number().default(0),
  prixTotal: z.number().default(0),
  produit: z.boolean().default(false),
  installationTerminee: z.boolean().default(false),
  reprise: z.boolean().default(false),
  notes: z.string().optional(),
});

// Schema principal de commande
export const commandeSchema = z.object({
  // Informations générales
  numero: z.string().min(1, "Le numéro est obligatoire"),
  clientId: z.string().min(1, "Le client est obligatoire"),
  representantId: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  typeCommande: TypeCommande.default("STANDARD"),
  service: ServiceCommande.default("INSTALLATION"),
  statut: StatutCommande.default("ACTIVE"),
  activite: TypeActivite.default("INSTALLATION"),
  adresse: z.string().min(1, "L'adresse est obligatoire"),

  // Commercial / Multiphase / Multiplan
  nombreBalcons: z.number().optional().nullable(),
  nombrePhases: z.number().optional().nullable(),
  piedsLineairesEstime: z.number().optional().nullable(),
  piedsLineairesReels: z.number().optional().nullable(),

  // Dates
  dateEntree: z.string().or(z.date()).optional(),
  datePrevue: z.string().or(z.date()).optional().nullable(),
  dateProduction: z.string().or(z.date()).optional().nullable(),
  datePriseMesure: z.string().or(z.date()).optional().nullable(),
  dateLivraison: z.string().or(z.date()).optional().nullable(),

  // Prix
  prixVenteMateriaux: z.number().default(0),
  prixVenteInstallation: z.number().default(0),
  prixTotal: z.number().default(0),

  // Mesures / Rampes
  tempsEstimeInstallation: z.number().default(0),
  piedsCarresFibre: z.number().optional().nullable(),
  piedsRampesBarrotin: z.number().default(0),
  piedsRampesVerre: z.number().default(0),
  piedsRampesMurIntimite: z.number().default(0),
  piedsRampesMainDouble: z.number().default(0),
  piedsRampesGardexVision: z.number().default(0),
  piedsRampesGardexVisionUrbaine: z.number().default(0),
  piedsRampesGardexVisionOptimum: z.number().default(0),
  piedsLineairesRampes: z.number().default(0),
  nombrePoteaux: z.number().default(0),

  // Production
  structure: z.boolean().default(false),
  couleur: z.string().optional().nullable(),
  mesure: CodeProduction.optional().nullable(),
  mesureDonneeLe: z.string().or(z.date()).optional().nullable(),
  plan: CodeProduction.optional().nullable(),
  envoyeProduction: CodeProduction.optional().nullable(),
  productionTerminee: CodeProduction.optional().nullable(),
  termine: CodeProduction.optional().nullable(),
  livraison: z.string().optional().nullable(),

  // Achats
  achatFibre: StatutAchat.optional().nullable(),
  dateReceptionFibre: z.string().or(z.date()).optional().nullable(),
  achatLimons: StatutAchat.optional().nullable(),
  dateReceptionLimons: z.string().or(z.date()).optional().nullable(),
  achatVerres: StatutAchat.optional().nullable(),
  dateReceptionVerre: z.string().or(z.date()).optional().nullable(),
  achatColonnes: StatutAchat.optional().nullable(),
  dateReceptionColonnes: z.string().or(z.date()).optional().nullable(),
  achatPeinture: StatutAchat.optional().nullable(),
  dateReceptionPeinture: z.string().or(z.date()).optional().nullable(),
  achatAttaches: StatutAchat.optional().nullable(),
  dateReceptionAttaches: z.string().or(z.date()).optional().nullable(),
  achatPlancherAluminium: StatutAchat.optional().nullable(),
  dateReceptionPlancherAluminium: z.string().or(z.date()).optional().nullable(),

  // Avertissements
  avertissementClient: AvertissementClient.optional().nullable(),
  dateAvertissement: z.string().or(z.date()).optional().nullable(),
  avertissementPriseMesure: AvertissementMesure.optional().nullable(),
  dateAvertissementPriseMesure: z.string().or(z.date()).optional().nullable(),

  // Flags
  reprise: z.boolean().default(false),
  enProduction: z.boolean().default(false),

  // Notes
  commentaire: z.string().optional().nullable(),

  // Balcons/Phases (pour COMMERCIAL, MULTI_PHASE, MULTIPLAN)
  balcons: z.array(balconSchema).optional(),
});

export type CommandeInput = z.infer<typeof commandeSchema>;
export type BalconInput = z.infer<typeof balconSchema>;

// Types pour les statistiques
export interface CommandeStats {
  total: number;
  parStatut: Record<string, number>;
  parType: Record<string, number>;
  parService: Record<string, number>;
  enProduction: number;
  enRetard: number;
}

// Type labels
export const TYPE_COMMANDE_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  STANDARD: { label: "Standard", color: "text-blue-700", bgColor: "bg-blue-100" },
  COMMERCIAL: { label: "Commercial", color: "text-purple-700", bgColor: "bg-purple-100" },
  MULTI_PHASE: { label: "Multi-Phase", color: "text-orange-700", bgColor: "bg-orange-100" },
  MULTIPLAN: { label: "Multiplan", color: "text-emerald-700", bgColor: "bg-emerald-100" },
};

export const SERVICE_COMMANDE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  INSTALLATION: { label: "Installation", color: "bg-blue-500", icon: "🔧" },
  LIVRAISON: { label: "Livraison", color: "bg-green-500", icon: "🚚" },
  CUEILLETTE: { label: "Cueillette", color: "bg-yellow-500", icon: "📦" },
  TRANSPORT: { label: "Transport", color: "bg-purple-500", icon: "🚛" },
  MESURE: { label: "Mesure", color: "bg-orange-500", icon: "📏" },
};

export const STATUT_COMMANDE_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: "Active", color: "text-green-700", bgColor: "bg-green-100" },
  EN_ATTENTE: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  COMPLETEE: { label: "Complétée", color: "text-blue-700", bgColor: "bg-blue-100" },
  ANNULEE: { label: "Annulée", color: "text-red-700", bgColor: "bg-red-100" },
};

// Fonction pour calculer les dates automatiquement
export function calculateDates(dateProduction: Date | null): {
  datePrevue: Date | null;
  dateLivraison: Date | null;
} {
  if (!dateProduction) return { datePrevue: null, dateLivraison: null };
  
  const datePrevue = new Date(dateProduction);
  datePrevue.setDate(datePrevue.getDate() - 7); // Une semaine avant la production
  
  return {
    datePrevue,
    dateLivraison: datePrevue, // Date livraison = Date prévue
  };
}

// Fonction pour obtenir le numéro de semaine
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Fonction pour formater la semaine
export function formatSemaine(date: Date | null): string {
  if (!date) return "—";
  const week = getWeekNumber(new Date(date));
  const year = new Date(date).getFullYear();
  return `S${week} ${year}`;
}