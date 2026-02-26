// ╔══════════════════════════════════════════════════════════════╗
// ║   TYPES — MODULE PLANIFICATION (Rampes Gardex)             ║
// ╚══════════════════════════════════════════════════════════════╝

// ──────────────────────────────────────────
// Énumérations locales (mirroring Prisma)
// ──────────────────────────────────────────
export type StatutPlanification =
  | "PLANIFIEE"
  | "CONFIRMEE"
  | "EN_COURS"
  | "COMPLETEE"
  | "REPORTEE"
  | "ANNULEE";

export type ServiceCommande =
  | "INSTALLATION"
  | "LIVRAISON"
  | "CUEILLETTE"
  | "TRANSPORT";

export type TypeCommande =
  | "STANDARD"
  | "COMMERCIAL"
  | "MULTI_PHASE"
  | "MULTIPLAN";

// ──────────────────────────────────────────
// Équipe
// ──────────────────────────────────────────
export interface Equipe {
  id: string;
  nom: string;
  couleur: string;
  actif: boolean;
  membres: MembreEquipe[];
  /** Computed : nombre d'installations actives */
  nbInstallations?: number;
  /** Computed : heures planifiées totales */
  heuresPlanifiees?: number;
}

export interface MembreEquipe {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface EquipeFormData {
  nom: string;
  couleur: string;
  membreIds: string[];
}

// ──────────────────────────────────────────
// Commande vue planification
// ──────────────────────────────────────────
export interface CommandePlanification {
  id: string;
  numero: string;
  clientNom: string;
  clientId: string;
  representantNom: string | null;
  reference: string | null;
  service: ServiceCommande;
  typeCommande: TypeCommande;
  statut: string;
  adresse: string;
  couleur: string | null;
  reprise: boolean;
  // Dates
  dateEntree: string;
  datePrevue: string | null;
  dateProduction: string | null;
  datePriseMesure: string | null;
  // Production status
  mesure: string | null;
  plan: string | null;
  envoyeProduction: string | null;
  productionTerminee: string | null;
  // Achats
  achatFibre: string | null;
  achatLimons: string | null;
  achatVerres: string | null;
  achatColonnes: string | null;
  achatPeinture: string | null;
  achatAttaches: string | null;
  achatPlancherAluminium: string | null;
  // Métriques
  piedsLineairesRampes: number;
  nombrePoteaux: number;
  tempsEstimeInstallation: number;
  // Planification
  equipeId: string | null;
  equipeNom: string | null;
  equipeCouleur: string | null;
  planificationId: string | null;
  planificationStatut: StatutPlanification | null;
  clientPresent: boolean;
  representantPresent: boolean;
  envoyerAvis: boolean;
  avisEnvoye: boolean;
  heureDebut: string | null;
  heureFin: string | null;
  commentaire: string | null;
}

// ──────────────────────────────────────────
// Planification (record dans la DB)
// ──────────────────────────────────────────
export interface Planification {
  id: string;
  commandeId: string;
  equipeId: string;
  datePlanifiee: string;
  heureDebut: string | null;
  heureFin: string | null;
  clientPresent: boolean;
  representantPresent: boolean;
  envoyerAvis: boolean;
  avisEnvoye: boolean;
  statut: StatutPlanification;
  notes: string | null;
}

export interface PlanificationFormData {
  commandeId: string;
  equipeId: string;
  datePlanifiee: string;
  heureDebut?: string;
  heureFin?: string;
  clientPresent: boolean;
  representantPresent: boolean;
  envoyerAvis: boolean;
  notes?: string;
}

export interface EditInstallationFormData {
  datePrevue: string;
  equipeId: string;
  tempsEstimeInstallation: number;
  heureDebut?: string;
  heureFin?: string;
  notes?: string;
}

// ──────────────────────────────────────────
// Agrégations calendrier
// ──────────────────────────────────────────
export interface DayInfo {
  day: number;
  currentMonth: boolean;
  date: Date;
}

export interface DayTotals {
  count: number;
  tempsTotal: number;
  piedsLineaires: number;
  poteaux: number;
  byEquipe: Record<
    string,
    {
      equipeNom: string;
      couleur: string;
      count: number;
      heures: number;
      piedsLin: number;
    }
  >;
}

export interface SemaineDuMois {
  num: number;
  label: string;
  startDate: string;
  endDate: string;
}

// ──────────────────────────────────────────
// Stats hebdo
// ──────────────────────────────────────────
export interface StatsHebdo {
  nbInstallations: number;
  heuresTotal: number;
  piedsTotal: number;
  nbDeplacements: number;
  nbEquipesActives: number;
  nbMesures: number;
}

// ──────────────────────────────────────────
// Charge d'équipe (pro addition)
// ──────────────────────────────────────────
export interface ChargeEquipeSemaine {
  equipeId: string;
  equipeNom: string;
  couleur: string;
  jours: {
    date: string;
    jourSemaine: string;
    heures: number;
    nbInstallations: number;
    capaciteMax: number;
    surcharge: boolean;
  }[];
  totalHeures: number;
  totalInstallations: number;
  tauxOccupation: number;
}

// ──────────────────────────────────────────
// Conflits (pro addition)
// ──────────────────────────────────────────
export interface ConflitPlanification {
  type: "SURCHARGE" | "DOUBLE_RESERVATION" | "WEEKEND" | "MULTI_JOUR_CHEVAUCHEMENT";
  message: string;
  date: string;
  equipeNom: string;
  commandeIds: string[];
  severite: "INFO" | "WARNING" | "ERROR";
}

// ──────────────────────────────────────────
// Filtres planification
// ──────────────────────────────────────────
export interface FiltresPlanification {
  type: "tous" | "installation" | "mesure";
  typeCommande: "tous" | "standard" | "commercial" | "multiplan" | "multiphase";
  equipe: string; // "toutes" ou equipeId
  semaine: string; // "toutes" ou numéro
  recherche: string;
}

export const FILTRES_DEFAUT: FiltresPlanification = {
  type: "tous",
  typeCommande: "tous",
  equipe: "toutes",
  semaine: "toutes",
  recherche: "",
};