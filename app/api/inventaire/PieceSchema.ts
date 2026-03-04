import { z } from 'zod';

// ╔══════════════════════════════════════════╗
// ║         SCHEMAS ZOD - INVENTAIRE         ║
// ╚══════════════════════════════════════════╝

// === PIÈCE (Produit) ===
export const PieceSchema = z.object({
  id: z.string(),
  code: z.string().min(1, 'Le code est obligatoire'),
  nom: z.string().min(1, 'La description est obligatoire'),
  description: z.string().nullable().optional(),
  couleur: z.string().nullable().optional(),
  categorie: z.string().nullable().optional(),
  categoriePieceId: z.string().nullable().optional(),
  uniteId: z.string().nullable().optional(),
  fournisseurId: z.string().nullable().optional(),
  quantite: z.number().int().default(0),
  inventaireEmplacement1: z.number().int().default(0),
  inventaireEmplacement2: z.number().int().default(0),
  partiPeinture: z.number().int().default(0),
  seuilMin: z.number().int().default(0),
  seuilMax: z.number().int().nullable().optional(),
  prixUnitaire: z.number().nullable().optional(),
  emplacement: z.string().nullable().optional(),
  emplacement2: z.string().nullable().optional(),
  codePieceNonPeinte: z.string().nullable().optional(),
  achatFait: z.boolean().default(false),
  piecePeinte: z.boolean().default(false),
  actif: z.boolean().default(true),
  dateDerniereTransaction: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  categoriePiece: z.object({ id: z.string(), nom: z.string() }).nullable().optional(),
  unite: z.object({ id: z.string(), unite: z.string(), qtePar: z.number(), description: z.string().nullable() }).nullable().optional(),
  fournisseur: z.object({ id: z.string(), nom: z.string() }).nullable().optional(),
});
export type Piece = z.infer<typeof PieceSchema>;

export const PieceFormSchema = z.object({
  code: z.string().min(1, 'Le code est obligatoire'),
  nom: z.string().min(1, 'La description est obligatoire'),
  description: z.string().optional().default(''),
  couleur: z.string().optional().default(''),
  categoriePieceId: z.string().optional().default(''),
  uniteId: z.string().optional().default(''),
  fournisseurId: z.string().optional().default(''),
  quantite: z.number().int().default(0),
  inventaireEmplacement1: z.number().int().default(0),
  inventaireEmplacement2: z.number().int().default(0),
  partiPeinture: z.number().int().default(0),
  seuilMin: z.number().int().default(0),
  seuilMax: z.number().int().optional(),
  prixUnitaire: z.number().optional(),
  emplacement: z.string().optional().default(''),
  emplacement2: z.string().optional().default(''),
  codePieceNonPeinte: z.string().optional().default(''),
  achatFait: z.boolean().default(false),
  piecePeinte: z.boolean().default(false),
  actif: z.boolean().default(true),
});
export type PieceForm = z.input<typeof PieceFormSchema>;

// === FOURNISSEUR ===
export const FournisseurSchema = z.object({
  id: z.string(),
  nom: z.string().min(1, 'Le nom est obligatoire'),
  contact: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  actif: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  _count: z.object({
    produitsPrincipaux: z.number().optional(),
    produits: z.number().optional(),
    achats: z.number().optional(),
  }).optional(),
});
export type FournisseurInv = z.infer<typeof FournisseurSchema>;

export const FournisseurFormSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  contact: z.string().optional().default(''),
  telephone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  adresse: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  actif: z.boolean().default(true),
});
export type FournisseurForm = z.input<typeof FournisseurFormSchema>;

// === UNITÉ ===
export const UniteSchema = z.object({
  id: z.string(),
  unite: z.string().min(1, "Le nom de l'unité est obligatoire"),
  qtePar: z.number().int().default(1),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  _count: z.object({ produits: z.number().optional() }).optional(),
});
export type UniteInv = z.infer<typeof UniteSchema>;

export const UniteFormSchema = z.object({
  unite: z.string().min(1, "Le nom de l'unité est obligatoire"),
  qtePar: z.number().int().default(1),
  description: z.string().optional().default(''),
});
export type UniteForm = z.input<typeof UniteFormSchema>;

// === CATÉGORIE PIÈCE ===
export const CategorieSchema = z.object({
  id: z.string(),
  nom: z.string().min(1, 'Le nom est obligatoire'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  _count: z.object({ produits: z.number().optional() }).optional(),
});
export type CategorieInv = z.infer<typeof CategorieSchema>;

export const CategorieFormSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
});
export type CategorieForm = z.infer<typeof CategorieFormSchema>;

// === TRANSACTION (MouvementStock) ===
export const TransactionSchema = z.object({
  id: z.string(),
  produitId: z.string(),
  commandeId: z.string().nullable().optional(),
  type: z.enum(['ENTREE', 'SORTIE', 'AJUSTEMENT', 'TRANSFERT', 'RETOUR', 'SORTIE_PEINTURE']),
  quantite: z.number().int(),
  quantiteAvant: z.number().int(),
  quantiteApres: z.number().int(),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  noTransaction: z.string().nullable().optional(),
  codePiecePeinte: z.string().nullable().optional(),
  dateReceptionPeinture: z.string().nullable().optional(),
  noOrdrePeinture: z.string().nullable().optional(),
  heureTransaction: z.string().nullable().optional(),
  emplacement: z.string().nullable().optional(),
  createdAt: z.string(),
  produit: z.object({ id: z.string(), code: z.string(), nom: z.string() }).optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionFormSchema = z.object({
  produitId: z.string().min(1, 'La pièce est obligatoire'),
  type: z.enum(['ENTREE', 'SORTIE', 'AJUSTEMENT', 'SORTIE_PEINTURE']),
  quantite: z.number().int().positive('La quantité doit être positive'),
  notes: z.string().default(''),
  emplacement: z.string().default(''),
});
export type TransactionForm = z.input<typeof TransactionFormSchema>;

// === TYPES NAVIGATION ===
export type VueInventaire = 'liste' | 'entrees-sorties' | 'transactions';

// === RÉPONSES API ===
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limite: number;
    total: number;
    totalPages: number;
  };
}

export interface StatsInventaire {
  totalPieces: number;
  piecesActives: number;
  piecesSousSeuilMin: number;
  valeurStock: number;
  totalFournisseurs: number;
}