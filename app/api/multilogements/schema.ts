// ============================================================
// schemas.ts — Zod Schemas pour le module Multi-logements
// ============================================================
import { z } from "zod";

// ─── Énumérations Zod (miroir du Prisma schema) ────────────

export const TypeCommandeSchema = z.enum([
  "STANDARD",
  "COMMERCIAL",
  "MULTI_PHASE",
  "MULTIPLAN",
  "MESURE",
]);

export const StatutCommandeSchema = z.enum([
  "ACTIVE",
  "EN_ATTENTE",
  "COMPLETEE",
  "ANNULEE",
]);

export const ServiceCommandeSchema = z.enum([
  "INSTALLATION",
  "LIVRAISON",
  "CUEILLETTE",
  "TRANSPORT",
  "MESURE",
]);

export const CodeProductionSchema = z
  .enum([
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
  ])
  .nullable()
  .optional();

export const StatutAchatSchema = z
  .enum(["A_FAIRE", "FAIT", "RECEPTIONNE", "PRET_A_RAMASSER", "BACK_ORDER"])
  .nullable()
  .optional();

export const StatutLivraisonSchema = z.enum(["N_A", "LIVRE"]);

export const CouleurSchema = z
  .enum([
    "NOIR",
    "BLANC",
    "BRUN_COMMERCIALE",
    "GRIS_CHARBON",
    "ARGILE",
    "SPECIALE",
    "GRIS_METALLIQUE",
    "AUTRE",
  ])
  .nullable()
  .optional();

export const AvertissementClientSchema = z
  .enum(["CONF_REP", "CONF_CLIENT", "ATT_REP_CLIENT"])
  .nullable()
  .optional();

export const AvertissementMesureSchema = z
  .enum(["PRESENCE_CLIENT", "PRESENCE_REPRESENTANT"])
  .nullable()
  .optional();

// ─── Schéma Balcon ──────────────────────────────────────────

export const BalconSchema = z.object({
  id: z.string(),
  commandeId: z.string(),
  nom: z.string().min(1, "Le nom du balcon est requis"),
  numeroPhase: z.number().int().nullable().optional(),
  piedsLineaires: z.number().int().default(0),
  poteaux: z.number().int().default(0),
  coutBalcon: z.number().default(0),
  prixTotal: z.number().default(0),
  produit: z.boolean().default(false),
  installationTerminee: z.boolean().default(false),
  reprise: z.boolean().default(false),
  notes: z.string().nullable().optional(),

  // Dates et prix par phase
  datePrevue: z.string().datetime().nullable().optional(),
  prixVenteInstallation: z.number().nullable().optional(),

  // Codes de production (suivi de progression)
  mesure: CodeProductionSchema,
  plan: CodeProductionSchema,
  planApprobationEnvoyeLe: z.string().datetime().nullable().optional(),
  envoyeProduction: CodeProductionSchema,
  termine: CodeProductionSchema,
  installation: CodeProductionSchema,

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Balcon = z.infer<typeof BalconSchema>;

// ─── Schéma Client (simplifié pour l'affichage) ─────────────

export const ClientResumeSchema = z.object({
  id: z.string(),
  nom: z.string(),
  ville: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
  personne_Contact: z.string().nullable().optional(),
});

export type ClientResume = z.infer<typeof ClientResumeSchema>;

// ─── Schéma Représentant (simplifié) ────────────────────────

export const RepresentantResumeSchema = z.object({
  id: z.string(),
  nom: z.string(),
  email: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
});

export type RepresentantResume = z.infer<typeof RepresentantResumeSchema>;

// ─── Schéma Commande Multi-logements ────────────────────────

export const CommandeMultiSchema = z.object({
  id: z.string(),
  numero: z.string(),
  clientId: z.string(),
  client: ClientResumeSchema,
  representantId: z.string().nullable().optional(),
  representant: RepresentantResumeSchema.nullable().optional(),
  reference: z.string().nullable().optional(),
  typeCommande: TypeCommandeSchema,
  service: ServiceCommandeSchema,
  statut: StatutCommandeSchema,
  adresse: z.string(),
  commentaireAdresse: z.string().nullable().optional(),
  couleur: CouleurSchema,
  couleurPersonnalisee: z.string().nullable().optional(),
  dateEntree: z.string().datetime(),
  datePrevue: z.string().datetime().nullable().optional(),
  dateProduction: z.string().datetime().nullable().optional(),
  datePriseMesure: z.string().datetime().nullable().optional(),
  dateLivraison: z.string().datetime().nullable().optional(),
  dateCompletion: z.string().datetime().nullable().optional(),
  semainePrevue: z.string().nullable().optional(),
  prixVenteMateriaux: z.number().default(0),
  prixVenteInstallation: z.number().default(0),
  prixTotal: z.number().default(0),

  // Pieds linéaires
  piedsLineairesBarrotin: z.number().int().default(0),
  piedsLineairesVerre: z.number().int().default(0),
  piedsLineairesMur: z.number().int().default(0),
  piedsLineairesMainDouble: z.number().int().default(0),
  piedsLineairesGardexVision: z.number().int().default(0),
  piedsLineairesGardexUrbaine: z.number().int().default(0),
  piedsLineairesGardexOptimum: z.number().int().default(0),
  piedsLineairesRampes: z.number().int().default(0),
  nombrePoteaux: z.number().int().default(0),
  tempsEstimeInstallation: z.number().int().default(0),
  nombreBalcons: z.number().int().nullable().optional(),
  nombrePhases: z.number().int().nullable().optional(),
  piedsLineairesEstime: z.number().int().nullable().optional(),
  piedsLineairesReels: z.number().int().nullable().optional(),

  // Codes de production globaux
  mesure: CodeProductionSchema,
  plan: CodeProductionSchema,
  envoyeProduction: CodeProductionSchema,
  productionTerminee: CodeProductionSchema,
  termine: CodeProductionSchema,
  statutLivraison: StatutLivraisonSchema.default("N_A"),
  installation: CodeProductionSchema,

  // Achats
  achatFibre: StatutAchatSchema,
  achatLimons: StatutAchatSchema,
  achatVerres: StatutAchatSchema,
  achatColonnes: StatutAchatSchema,
  achatPeinture: StatutAchatSchema,
  achatAttaches: StatutAchatSchema,
  achatPlancherAluminium: StatutAchatSchema,

  // Avertissements
  avertissementClient: AvertissementClientSchema,
  avertissementPriseMesure: AvertissementMesureSchema,

  // Flags
  enProduction: z.boolean().default(false),
  structure: z.boolean().default(false),
  commentaire: z.string().nullable().optional(),

  // Relations
  balcons: z.array(BalconSchema).default([]),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type CommandeMulti = z.infer<typeof CommandeMultiSchema>;

// ─── Schéma liste (réponse API) ─────────────────────────────

export const CommandeMultiListResponseSchema = z.object({
  commandes: z.array(CommandeMultiSchema),
  total: z.number().int(),
  stats: z.object({
    totalCommandes: z.number().int(),
    commandesCommercial: z.number().int(),
    commandesMultiPhase: z.number().int(),
    commandesMultiPlan: z.number().int(),
    totalBalcons: z.number().int(),
    balconsCompletes: z.number().int(),
    totalPiedsLineaires: z.number().int(),
  }),
});

export type CommandeMultiListResponse = z.infer<
  typeof CommandeMultiListResponseSchema
>;

// ─── Schéma détail (réponse API détail commande) ────────────

export const CommandeMultiDetailResponseSchema = z.object({
  commande: CommandeMultiSchema,
  progression: z.object({
    totalBalcons: z.number().int(),
    balconsTermines: z.number().int(),
    pourcentage: z.number(),
    parPhase: z
      .array(
        z.object({
          phase: z.number().int(),
          nom: z.string(),
          total: z.number().int(),
          completes: z.number().int(),
          pourcentage: z.number(),
        })
      )
      .optional(),
  }),
});

export type CommandeMultiDetailResponse = z.infer<
  typeof CommandeMultiDetailResponseSchema
>;

// ─── Schéma des query params (filtres) ──────────────────────

export const MultiLogementsQuerySchema = z.object({
  type: z
    .enum(["tous", "COMMERCIAL", "MULTI_PHASE", "MULTIPLAN"])
    .default("tous"),
  statut: z
    .enum(["tous", "ACTIVE", "EN_ATTENTE", "COMPLETEE", "ANNULEE"])
    .default("tous"),
  recherche: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type MultiLogementsQuery = z.infer<typeof MultiLogementsQuerySchema>;