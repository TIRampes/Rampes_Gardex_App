// ╔══════════════════════════════════════════════════════════════╗
// ║   TYPES — MODULE INVENTAIRE (Rampes Gardex)                 ║
// ╚══════════════════════════════════════════════════════════════╝

import { Pi } from "lucide-react";

export interface Piece {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  categoriePieceId: string | null;
  categoriePiece: { id: string; nom: string } | null;
  uniteId: string | null;
  unite: { id: string; unite: string; qtePar: number } | null;
  uniteLegacy: string | null;
  quantite: number;
  seuilMin: number;
  seuilMax: number | null;
  prixUnitaire: number | null;
  emplacement: string | null;
  emplacement2: string | null;
  inventaireEmplacement1: number;
  inventaireEmplacement2: number;
  couleur: string | null;
  codePieceNonPeinte: string | null;
  achatFait: boolean;
  partiPeinture: number;
  piecePeinte: boolean;
  dateDerniereTransaction: string | null;
  fournisseurId: string | null;
  fournisseur: { id: string; nom: string } | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PieceForm {
  code: string;
  nom: string;
  description?: string;
  categoriePieceId?: string;
  uniteId?: string;
  quantite: number;
  seuilMin: number;
  seuilMax?: number;
  prixUnitaire?: number;
  emplacement?: string;
  emplacement2?: string;
  inventaireEmplacement1: number;
  inventaireEmplacement2: number;
  couleur?: string;
  codePieceNonPeinte?: string;
  piecePeinte: boolean;
  fournisseurId?: string;
  actif: boolean;
}

export interface FournisseurInv {
  id: string;
  nom: string;
  contact: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  notes: string | null;
  actif: boolean;
  _count?: { produitsPrincipaux: number; produits: number; achats: number };
  createdAt: string;
  updatedAt: string;
}

export interface FournisseurForm {
  nom: string;
  contact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  notes?: string;
  actif: boolean;
}

export interface UniteInv {
  id: string;
  unite: string;
  qtePar: number;
  description: string | null;
  _count?: { produits: number };
  createdAt: string;
  updatedAt: string;
}

export interface UniteForm {
  unite: string;
  qtePar: number;
  description?: string;
}

export interface CategorieInv {
  id: string;
  nom: string;
  _count?: { produits: number };
  createdAt: string;
  updatedAt: string;
}

export interface CategorieForm {
  nom: string;
}

export interface StatsInventaire {
  totalPieces: number;
  totalActives: number;
  totalFournisseurs: number;
  totalUnites: number;
  totalCategories: number;
  piecesSousSeuilMin: number;
  valeurTotaleStock: number;
  derniersMovements: number;
}

export interface Transaction {
  id: string;
  type: 'ENTREE' | 'SORTIE';
  pieceId: string;
  piece: { id: string; code: string; nom: string } | null;
  quantite: number;
  date: string;
  fournisseurId?: string;
  fournisseur?: { id: string; nom: string } | null;
}

export interface TransactionForm {
  type: 'ENTREE' | 'SORTIE';
  pieceId: string;
  quantite: number;
  date: string;
  fournisseurId?: string;
}



export type OngletInventaire = "dashboard" | "pieces" | "fournisseurs" | "unites" | "categories";