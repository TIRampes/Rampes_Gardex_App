// ╔══════════════════════════════════════════════════════════════╗
// ║   TYPES — MODULE ATTENTES (Rampes Gardex)                   ║
// ╚══════════════════════════════════════════════════════════════╝

// ──── Types d'attente (champs pouvant contenir une attente) ────
export type ChampAttente =
  | "mesure"
  | "plan"
  | "envoyeProduction"
  | "productionTerminee";

export type CodeAttente =
  | "ATTENTE_CLIENT"
  | "ATTENTE_REPRESENTANT"
  | "ATTENTE_CAROL_CONFIRM"
  | "ATTENTE_CAROL_MESURE"
  | "BACK_ORDER"
  | "PARTIEL"
  | "DOSSIER_MESUREUR"
  | "MODIFICATION";

export type TypeAttenteLabel =
  | "client"
  | "representant"
  | "carol"
  | "back_order"
  | "autre";

// ──── Représentant ────
export interface Representant {
  id: string;
  initiales: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  actif: boolean;
}

// ──── Commande en attente ────
export interface CommandeAttente {
  id: string;
  numero: string;
  clientId: string;
  clientNom: string;
  clientTelephone: string | null;
  representantId: string;
  representantInitiales: string;
  representantNom: string;
  representantEmail: string;
  reference: string | null;
  adresse: string;
  service: string;
  typeCommande: string;
  dateEntree: string;
  datePrevue: string | null;
  // Production
  mesure: string | null;
  plan: string | null;
  envoyeProduction: string | null;
  productionTerminee: string | null;
  // Technique
  piedsLineairesRampes: number;
  nombrePoteaux: number;
  couleur: string | null;
  modele: string | null;
  // Attente
  champsEnAttente: { champ: ChampAttente; code: string }[];
  typeAttente: TypeAttenteLabel;
  notes: string | null;
  commentaire: string | null;
  // Historique envois
  dernierEnvoi: EnvoiAttente | null;
  nbEnvoisTotal: number;
  joursDepuisDernierEnvoi: number | null;
  joursEnAttente: number;
}

// ──── Envoi d'attente (historique) ────
export interface EnvoiAttente {
  id: string;
  dateEnvoi: string;
  representantId: string;
  representantNom: string;
  type: "INDIVIDUEL" | "GROUPÉ" | "AUTOMATIQUE";
  nbCommandes: number;
  statut: "ENVOYE" | "ERREUR" | "EN_COURS";
  messageId: string | null;
}

// ──── Stats ────
export interface StatsAttentes {
  totalEnAttente: number;
  totalCommandes: number;
  pourcentageEnAttente: number;
  parRepresentant: {
    representantId: string;
    initiales: string;
    nom: string;
    count: number;
    dernierEnvoi: string | null;
  }[];
  parTypeAttente: {
    type: TypeAttenteLabel;
    label: string;
    count: number;
    pourcentage: number;
  }[];
  parAnciennete: {
    tranche: string;
    count: number;
  }[];
  parService: {
    service: string;
    count: number;
  }[];
  envoisCetteSemaine: number;
  prochainEnvoiAuto: string | null;
}

// ──── Filtres ────
export interface FiltresAttentes {
  representantIds: string[];
  typeAttente: TypeAttenteLabel | "tous";
  service: string;
  recherche: string;
  tri: { champ: string; ordre: "asc" | "desc" };
  ancienneteMin: number | null;
}

export const FILTRES_ATTENTES_DEFAUT: FiltresAttentes = {
  representantIds: [],
  typeAttente: "tous",
  service: "tous",
  recherche: "",
  tri: { champ: "joursEnAttente", ordre: "desc" },
  ancienneteMin: null,
};

// ──── Config envoi automatique ────
export interface ConfigEnvoiAuto {
  actif: boolean;
  jourSemaine: number; // 0=dim … 1=lun
  heureEnvoi: string;  // "08:00"
}