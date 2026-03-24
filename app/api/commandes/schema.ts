import { z } from "zod";

// Enums
export const TypeCommande = z.enum(["STANDARD", "COMMERCIAL", "MULTI_PHASE", "MULTIPLAN"]);
export const ServiceCommande = z.enum(["INSTALLATION", "LIVRAISON", "CUEILLETTE", "TRANSPORT"]);
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
  "APPROBATION_PLAN", 
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

// NOUVEAU: Enum pour les couleurs
export const Couleur = z.enum([
  "NOIR",
  "BLANC",
  "BRUN_COMMERCIALE",
  "GRIS_CHARBON",
  "ARGILE",
  "SPECIALE",
  "GRIS_METALLIQUE",
  "AUTRE",
]);

// NOUVEAU: Enum pour le statut livraison
export const StatutLivraison = z.enum(["N_A", "LIVRE"]);

// NOUVEAU: Type pour les achats par phase
export const TypeAchatPhase = z.enum([
  "FIBRE",
  "LIMONS",
  "VERRES",
  "COLONNES",
  "PEINTURE",
  "ATTACHES",
  "PLANCHER_ALUMINIUM",
  "EUROFORGINGS",
  "PEINTURE_DJ",
  "VERRE_LEPAGE",
]);

// NOUVEAU: Mapping des couleurs avec labels
export const COULEUR_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  NOIR: { label: "Noir", color: "text-gray-900", bgColor: "bg-gray-200" },
  BLANC: { label: "Blanc", color: "text-gray-700", bgColor: "bg-gray-100" },
  BRUN_COMMERCIALE: { label: "Brun commerciale", color: "text-amber-900", bgColor: "bg-amber-200" },
  GRIS_CHARBON: { label: "Gris charbon", color: "text-gray-800", bgColor: "bg-gray-300" },
  ARGILE: { label: "Argile", color: "text-amber-800", bgColor: "bg-amber-100" },
  SPECIALE: { label: "Spéciale", color: "text-purple-800", bgColor: "bg-purple-200" },
  GRIS_METALLIQUE: { label: "Gris métallique", color: "text-gray-700", bgColor: "bg-gray-300" },
  AUTRE: { label: "Autre", color: "text-blue-800", bgColor: "bg-blue-200" },
};

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
  APPROBATION_PLAN: { symbol: "AP", label: "Approbation plan", color: "text-purple-600 bg-purple-100" }, // Nouveau
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

// NOUVEAU: Mapping des facteurs pour pieds linéaires
export const PIEDS_LINEAIRES_FACTEURS: Record<string, number> = {
  piedsLineairesBarrotin: 1.25,
  piedsLineairesVerre: 1,
  piedsLineairesMur: 4,
  piedsLineairesMainDouble: 2.25,
  piedsLineairesGardexVision: 1,
  piedsLineairesGardexUrbaine: 2,
  piedsLineairesGardexOptimum: 0.75,
};

// NOUVEAU: Mapping des couleurs d'activité pour le tableau de bord
export const ACTIVITE_COULEURS: Record<string, { bg: string; text: string; border: string }> = {
  INSTALLATION: { bg: "bg-red-500", text: "text-white", border: "border-red-600" },
  LIVRAISON: { bg: "bg-blue-500", text: "text-white", border: "border-blue-600" },
  CUEILLETTE: { bg: "bg-yellow-500", text: "text-white", border: "border-yellow-600" },
  TRANSPORT: { bg: "bg-green-500", text: "text-white", border: "border-green-600" },
};

// NOUVEAU: Structure pour les achats avec nouveaux champs
export const achatDetailSchema = z.object({
  statut: StatutAchat.optional().nullable(),
  dateEnvoie: z.string().or(z.date()).optional().nullable(),
  dateReception: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecue: z.number().optional().nullable(),
});

// Schema pour les balcons/phases (mis à jour avec les nouveaux champs)
export const balconSchema = z.object({
  id: z.string().optional(),
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
  // Nouveaux champs
  datePrevue: z.string().or(z.date()).optional().nullable(),
  prixVenteInstallation: z.number().optional().nullable(),
  mesure: CodeProduction.optional().nullable(),
  plan: CodeProduction.optional().nullable(),
  planApprobationEnvoyeLe: z.string().or(z.date()).optional().nullable(),
  envoyeProduction: CodeProduction.optional().nullable(),
  termine: CodeProduction.optional().nullable(),
  installation: CodeProduction.optional().nullable(),
});

// NOUVEAU: Schema pour structure d'achat
export const structureAchatSchema = z.object({
  id: z.string().optional(),
  nom: z.string().min(1, "Le nom est obligatoire"),
  statutAchat: StatutAchat.default("A_FAIRE"),
  dateEnvoie: z.string().or(z.date()).optional().nullable(),
  dateReception: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecue: z.number().optional().nullable(),
  phase: z.number().optional().nullable(), // pour lier à une phase
});

// NOUVEAU: Schema pour achat par phase
export const achatPhaseSchema = z.object({
  id: z.string().optional(),
  phaseNumero: z.number(),
  typeAchat: TypeAchatPhase,
  statut: StatutAchat.default("A_FAIRE"),
  dateEnvoie: z.string().or(z.date()).optional().nullable(),
  dateReception: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecue: z.number().optional().nullable(),
  // Champs spécifiques (optionnels)
  codeProduit: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantite: z.number().optional().nullable(),
  prixUnitaire: z.number().optional().nullable(),
  couleur: z.string().optional().nullable(),
  epaisseur: z.string().optional().nullable(),
  typeVerre: z.string().optional().nullable(),
  longueur: z.number().optional().nullable(),
  hauteur: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Schema principal de commande (mis à jour)
export const commandeSchema = z.object({
  // Informations générales
  numero: z.string().min(1, "Le numéro est obligatoire"),
  clientId: z.string().min(1, "Le client est obligatoire"),
  representantId: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  typeCommande: TypeCommande.default("STANDARD"),
  service: ServiceCommande.default("INSTALLATION"),
  statut: StatutCommande.default("ACTIVE"),
  adresse: z.string().min(1, "L'adresse est obligatoire"),
  commentaireAdresse: z.string().optional().nullable(),

  // NOUVEAU: Couleur
  couleur: Couleur.optional().nullable(),
  couleurPersonnalisee: z.string().optional().nullable(),

  // NOUVEAU: Reprise
  reprise: z.boolean().default(false),
  ancienneCommandeNumero: z.string().optional().nullable(),

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
  semainePrevue: z.string().optional().nullable(),

  // Prix
  prixVenteMateriaux: z.number().default(0),
  prixVenteInstallation: z.number().default(0),
  prixTotal: z.number().default(0),

  // NOUVEAU: Temps d'installation auto
  tempsInstallationAuto: z.number().default(0),
  utiliserCalculAuto: z.boolean().default(false),

  // NOUVEAU: Pieds linéaires par type
  piedsLineairesBarrotin: z.number().default(0),
  piedsLineairesVerre: z.number().default(0),
  piedsLineairesMur: z.number().default(0),
  piedsLineairesMainDouble: z.number().default(0),
  piedsLineairesGardexVision: z.number().default(0),
  piedsLineairesGardexUrbaine: z.number().default(0),
  piedsLineairesGardexOptimum: z.number().default(0),
  piedsLineairesRampes: z.number().default(0),
  nombrePoteaux: z.number().default(0),

  // Anciens champs pour compatibilité
  tempsEstimeInstallation: z.number().default(0),
  piedsCarresFibre: z.number().optional().nullable(),
  piedsRampesBarrotin: z.number().default(0),
  piedsRampesVerre: z.number().default(0),
  piedsRampesMurIntimite: z.number().default(0),
  piedsRampesMainDouble: z.number().default(0),
  piedsRampesGardexVision: z.number().default(0),
  piedsRampesGardexVisionUrbaine: z.number().default(0),
  piedsRampesGardexVisionOptimum: z.number().default(0),

  // Production
  structure: z.boolean().default(false),
  mesure: CodeProduction.optional().nullable(),
  mesureDonneeLe: z.string().or(z.date()).optional().nullable(),
  plan: CodeProduction.optional().nullable(),
  planApprobationEnvoyeLe: z.string().or(z.date()).optional().nullable(), // Nouveau
  envoyeProduction: CodeProduction.optional().nullable(),
  productionTerminee: CodeProduction.optional().nullable(),
  termine: CodeProduction.optional().nullable(),

  // NOUVEAU: Statut livraison
  statutLivraison: StatutLivraison.default("N_A"),

  // NOUVEAU: Installation
  installation: CodeProduction.optional().nullable(),

  // NOUVEAU: Achats avec nouveaux champs
  achatFibre: StatutAchat.optional().nullable(),
  dateEnvoieFibre: z.string().or(z.date()).optional().nullable(),
  dateReceptionFibre: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecueFibre: z.number().optional().nullable(),

  achatLimons: StatutAchat.optional().nullable(),
  dateEnvoieLimons: z.string().or(z.date()).optional().nullable(),
  dateReceptionLimons: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecueLimons: z.number().optional().nullable(),

  achatVerres: StatutAchat.optional().nullable(),
  dateEnvoieVerres: z.string().or(z.date()).optional().nullable(),
  dateReceptionVerre: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecueVerres: z.number().optional().nullable(),

  achatColonnes: StatutAchat.optional().nullable(),
  dateEnvoieColonnes: z.string().or(z.date()).optional().nullable(),
  dateReceptionColonnes: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecueColonnes: z.number().optional().nullable(),

  achatPeinture: StatutAchat.optional().nullable(),
  dateEnvoiePeinture: z.string().or(z.date()).optional().nullable(),
  dateReceptionPeinture: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecuePeinture: z.number().optional().nullable(),

  achatAttaches: StatutAchat.optional().nullable(),
  dateEnvoieAttaches: z.string().or(z.date()).optional().nullable(),
  dateReceptionAttaches: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecueAttaches: z.number().optional().nullable(),

  achatPlancherAluminium: StatutAchat.optional().nullable(),
  dateEnvoiePlancherAluminium: z.string().or(z.date()).optional().nullable(),
  dateReceptionPlancherAluminium: z.string().or(z.date()).optional().nullable(),
  quantiteNonRecuePlancherAluminium: z.number().optional().nullable(),

  // Avertissements
  avertissementClient: AvertissementClient.optional().nullable(),
  dateAvertissement: z.string().or(z.date()).optional().nullable(),
  avertissementPriseMesure: AvertissementMesure.optional().nullable(),
  dateAvertissementPriseMesure: z.string().or(z.date()).optional().nullable(),

  // Flags
  enProduction: z.boolean().default(false),
  clientPresent: z.boolean().default(false),
  formulaireComplete: z.boolean().default(false),

  // Commentaire (déplacé dans infos générales)
  commentaire: z.string().optional().nullable(),

  // Balcons/Phases
  balcons: z.array(balconSchema).optional(),

  // NOUVEAU: Structures d'achat
  structuresAchat: z.array(structureAchatSchema).optional(),

  // NOUVEAU: Achats par phase
  achatsPhase: z.array(achatPhaseSchema).optional(),
});

export type CommandeInput = z.infer<typeof commandeSchema>;
export type BalconInput = z.infer<typeof balconSchema>;
export type StructureAchatInput = z.infer<typeof structureAchatSchema>;
export type AchatPhaseInput = z.infer<typeof achatPhaseSchema>;

// Types pour les statistiques
export interface CommandeStats {
  total: number;
  parStatut: Record<string, number>;
  parType: Record<string, number>;
  parService: Record<string, number>;
  parRepresentant: Record<string, number>;
  parClient: Record<string, number>;
  enProduction: number;
  enRetard: number;
  actives: number;
  completees: number;
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
};

export const STATUT_COMMANDE_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: "Active", color: "text-green-700", bgColor: "bg-green-100" },
  EN_ATTENTE: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  COMPLETEE: { label: "Complétée", color: "text-blue-700", bgColor: "bg-blue-100" },
  ANNULEE: { label: "Annulée", color: "text-red-700", bgColor: "bg-red-100" },
};

// NOUVEAU: Mapping des couleurs pour le tableau de bord
export const ACTIVITE_COULEURS_BORD: Record<string, string> = {
  INSTALLATION: "bg-red-500",
  LIVRAISON: "bg-blue-500",
  CUEILLETTE: "bg-yellow-500",
  TRANSPORT: "bg-green-500",
};

// Fonction pour calculer les dates automatiquement en fonction des achats
export function calculateDates(
  dateProduction: Date | null,
  achatsAvecDelais: Array<{ delaiFournisseur: number }> = []
): {
  datePrevue: Date | null;
  dateProduction: Date | null;
  semainePrevue: string | null;
} {
  if (!dateProduction) return { datePrevue: null, dateProduction: null, semainePrevue: null };
  
  // Calculer le délai maximum des fournisseurs
  const delaiMax = achatsAvecDelais.length > 0 
    ? Math.max(...achatsAvecDelais.map(a => a.delaiFournisseur))
    : 0;
  
  // Date prévue = dateProduction + délai max des fournisseurs
  const datePrevue = new Date(dateProduction);
  if (delaiMax > 0) {
    datePrevue.setDate(datePrevue.getDate() + delaiMax);
  }
  
  // Date production = date prévue - 7 jours
  const dateProd = new Date(datePrevue);
  dateProd.setDate(dateProd.getDate() - 7);
  
  // Semaine prévue
  const semainePrevue = formatSemaine(datePrevue);
  
  return {
    datePrevue,
    dateProduction: dateProd,
    semainePrevue,
  };
}

// NOUVEAU: Fonction pour calculer le temps d'installation automatique
export function calculateTempsInstallationAuto(
  coutTotalInstallation: number,
  coutHeure: number = 160,
  facteur: number = 0.7
): number {
  if (coutTotalInstallation <= 0 || coutHeure <= 0) return 0;
  return (coutTotalInstallation / coutHeure) * facteur;
}

// NOUVEAU: Fonction pour calculer les pieds linéaires totaux avec facteurs
export function calculatePiedsLineairesTotaux(
  valeurs: Record<string, number>
): number {
  let total = 0;
  for (const [key, facteur] of Object.entries(PIEDS_LINEAIRES_FACTEURS)) {
    if (valeurs[key]) {
      total += valeurs[key] * facteur;
    }
  }
  return Math.round(total); // Arrondi à l'unité
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