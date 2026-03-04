import { Prisma } from '@prisma/client'

export type ProduitWithRelations = Prisma.ProduitGetPayload<{
  include: { categoriePiece: true; unite: true; fournisseur: true }
}>

export type FournisseurWithRelations = Prisma.FournisseurGetPayload<{
  include: { produitsPrincipaux: true }
}>

export type MouvementWithRelations = Prisma.MouvementStockGetPayload<{
  include: { produit: true }
}>