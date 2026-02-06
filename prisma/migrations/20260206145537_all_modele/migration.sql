/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `clients` ADD COLUMN `pays` VARCHAR(100) NULL;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `representants` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `telephone` VARCHAR(20) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `representants_nom_idx`(`nom`),
    INDEX `representants_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipes` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `couleur` VARCHAR(50) NOT NULL DEFAULT 'bg-blue-500',
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `equipes_nom_key`(`nom`),
    INDEX `equipes_nom_idx`(`nom`),
    INDEX `equipes_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `role` ENUM('ADMIN', 'GESTIONNAIRE', 'EMPLOYE', 'CHAUFFEUR', 'INSTALLATEUR', 'MESUREUR', 'CLIENT', 'REPRESENTANT', 'PRODUCTEUR') NOT NULL DEFAULT 'EMPLOYE',
    `telephone` VARCHAR(20) NULL,
    `equipeId` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_nom_idx`(`nom`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_equipeId_idx`(`equipeId`),
    INDEX `users_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fournisseurs` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(255) NULL,
    `telephone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `adresse` TEXT NULL,
    `notes` TEXT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fournisseurs_nom_idx`(`nom`),
    INDEX `fournisseurs_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produits` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `categorie` VARCHAR(100) NOT NULL,
    `unite` VARCHAR(50) NOT NULL,
    `quantite` INTEGER NOT NULL DEFAULT 0,
    `seuilMin` INTEGER NOT NULL DEFAULT 0,
    `seuilMax` INTEGER NULL,
    `prixUnitaire` DECIMAL(10, 2) NULL,
    `emplacement` VARCHAR(100) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `produits_nom_idx`(`nom`),
    INDEX `produits_categorie_idx`(`categorie`),
    INDEX `produits_quantite_idx`(`quantite`),
    INDEX `produits_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fournisseur_produits` (
    `id` VARCHAR(191) NOT NULL,
    `fournisseurId` VARCHAR(191) NOT NULL,
    `produitId` VARCHAR(191) NOT NULL,
    `codeFournisseur` VARCHAR(50) NULL,
    `prixAchat` DECIMAL(10, 2) NULL,
    `delaiLivraison` INTEGER NULL,
    `favori` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fournisseur_produits_fournisseurId_idx`(`fournisseurId`),
    INDEX `fournisseur_produits_produitId_idx`(`produitId`),
    UNIQUE INDEX `fournisseur_produits_fournisseurId_produitId_key`(`fournisseurId`, `produitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commandes` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(50) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `representantId` VARCHAR(191) NULL,
    `reference` VARCHAR(100) NULL,
    `typeCommande` ENUM('STANDARD', 'COMMERCIAL', 'MULTI_PHASE', 'MULTIPLAN') NOT NULL DEFAULT 'STANDARD',
    `service` ENUM('INSTALLATION', 'LIVRAISON', 'CUEILLETTE', 'TRANSPORT', 'MESURE') NOT NULL DEFAULT 'INSTALLATION',
    `statut` ENUM('ACTIVE', 'EN_ATTENTE', 'COMPLETEE', 'ANNULEE') NOT NULL DEFAULT 'ACTIVE',
    `activite` ENUM('INSTALLATION', 'LIVRAISON', 'CUEILLETTE', 'TRANSPORT') NOT NULL DEFAULT 'INSTALLATION',
    `adresse` TEXT NOT NULL,
    `dateEntree` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `datePrevue` DATETIME(3) NULL,
    `dateProduction` DATETIME(3) NULL,
    `datePriseMesure` DATETIME(3) NULL,
    `dateLivraison` DATETIME(3) NULL,
    `dateCompletion` DATETIME(3) NULL,
    `prixVenteMateriaux` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `prixVenteInstallation` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `prixTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tempsEstimeInstallation` INTEGER NOT NULL DEFAULT 0,
    `piedsCarresFibre` INTEGER NULL,
    `piedsRampesBarrotin` INTEGER NOT NULL DEFAULT 0,
    `piedsRampesVerre` INTEGER NOT NULL DEFAULT 0,
    `piedsRampesMurIntimite` INTEGER NOT NULL DEFAULT 0,
    `piedsRampesMainDouble` INTEGER NOT NULL DEFAULT 0,
    `piedsRampesGardexVision` INTEGER NOT NULL DEFAULT 0,
    `piedsRampesGardexVisionUrbaine` INTEGER NOT NULL DEFAULT 0,
    `piedsRampesGardexVisionOptimum` INTEGER NOT NULL DEFAULT 0,
    `piedsLineairesRampes` INTEGER NOT NULL DEFAULT 0,
    `nombrePoteaux` INTEGER NOT NULL DEFAULT 0,
    `nombreBalcons` INTEGER NULL,
    `nombrePhases` INTEGER NULL,
    `piedsLineairesEstime` INTEGER NULL,
    `piedsLineairesReels` INTEGER NULL,
    `structure` BOOLEAN NOT NULL DEFAULT false,
    `couleur` VARCHAR(50) NULL,
    `mesure` ENUM('COMPLETE', 'ATTENTE_CLIENT', 'NON_APPLICABLE', 'PARTIEL', 'DOSSIER_MESUREUR', 'MODIFICATION', 'ATTENTE_CAROL_CONFIRM', 'ATTENTE_CAROL_MESURE', 'BACK_ORDER', 'ATTENTE_REPRESENTANT') NULL,
    `mesureDonneeLe` DATETIME(3) NULL,
    `plan` ENUM('COMPLETE', 'ATTENTE_CLIENT', 'NON_APPLICABLE', 'PARTIEL', 'DOSSIER_MESUREUR', 'MODIFICATION', 'ATTENTE_CAROL_CONFIRM', 'ATTENTE_CAROL_MESURE', 'BACK_ORDER', 'ATTENTE_REPRESENTANT') NULL,
    `envoyeProduction` ENUM('COMPLETE', 'ATTENTE_CLIENT', 'NON_APPLICABLE', 'PARTIEL', 'DOSSIER_MESUREUR', 'MODIFICATION', 'ATTENTE_CAROL_CONFIRM', 'ATTENTE_CAROL_MESURE', 'BACK_ORDER', 'ATTENTE_REPRESENTANT') NULL,
    `productionTerminee` ENUM('COMPLETE', 'ATTENTE_CLIENT', 'NON_APPLICABLE', 'PARTIEL', 'DOSSIER_MESUREUR', 'MODIFICATION', 'ATTENTE_CAROL_CONFIRM', 'ATTENTE_CAROL_MESURE', 'BACK_ORDER', 'ATTENTE_REPRESENTANT') NULL,
    `termine` ENUM('COMPLETE', 'ATTENTE_CLIENT', 'NON_APPLICABLE', 'PARTIEL', 'DOSSIER_MESUREUR', 'MODIFICATION', 'ATTENTE_CAROL_CONFIRM', 'ATTENTE_CAROL_MESURE', 'BACK_ORDER', 'ATTENTE_REPRESENTANT') NULL,
    `achatFibre` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NULL,
    `dateReceptionFibre` DATETIME(3) NULL,
    `achatLimons` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NULL,
    `dateReceptionLimons` DATETIME(3) NULL,
    `achatVerres` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NULL,
    `dateReceptionVerre` DATETIME(3) NULL,
    `achatColonnes` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NULL,
    `dateReceptionColonnes` DATETIME(3) NULL,
    `achatPeinture` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NULL,
    `dateReceptionPeinture` DATETIME(3) NULL,
    `achatAttaches` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NULL,
    `dateReceptionAttaches` DATETIME(3) NULL,
    `achatPlancherAluminium` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NULL,
    `dateReceptionPlancherAluminium` DATETIME(3) NULL,
    `avertissementClient` ENUM('CONF_REP', 'CONF_CLIENT', 'ATT_REP_CLIENT') NULL,
    `dateAvertissement` DATETIME(3) NULL,
    `avertissementPriseMesure` ENUM('PRESENCE_CLIENT', 'PRESENCE_REPRESENTANT') NULL,
    `dateAvertissementPriseMesure` DATETIME(3) NULL,
    `livraison` VARCHAR(50) NULL,
    `reprise` BOOLEAN NOT NULL DEFAULT false,
    `enProduction` BOOLEAN NOT NULL DEFAULT false,
    `clientPresent` BOOLEAN NOT NULL DEFAULT false,
    `formulaireComplete` BOOLEAN NOT NULL DEFAULT false,
    `commentaire` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `commandes_numero_key`(`numero`),
    INDEX `commandes_numero_idx`(`numero`),
    INDEX `commandes_clientId_idx`(`clientId`),
    INDEX `commandes_representantId_idx`(`representantId`),
    INDEX `commandes_statut_idx`(`statut`),
    INDEX `commandes_typeCommande_idx`(`typeCommande`),
    INDEX `commandes_service_idx`(`service`),
    INDEX `commandes_dateEntree_idx`(`dateEntree`),
    INDEX `commandes_datePrevue_idx`(`datePrevue`),
    INDEX `commandes_enProduction_idx`(`enProduction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `balcons` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `numeroPhase` INTEGER NULL,
    `piedsLineaires` INTEGER NOT NULL DEFAULT 0,
    `poteaux` INTEGER NOT NULL DEFAULT 0,
    `coutBalcon` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `prixTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `produit` BOOLEAN NOT NULL DEFAULT false,
    `installationTerminee` BOOLEAN NOT NULL DEFAULT false,
    `reprise` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `balcons_commandeId_idx`(`commandeId`),
    INDEX `balcons_numeroPhase_idx`(`numeroPhase`),
    INDEX `balcons_installationTerminee_idx`(`installationTerminee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planifications` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `equipeId` VARCHAR(191) NOT NULL,
    `datePlanifiee` DATETIME(3) NOT NULL,
    `heureDebut` VARCHAR(10) NULL,
    `heureFin` VARCHAR(10) NULL,
    `clientPresent` BOOLEAN NOT NULL DEFAULT false,
    `representantPresent` BOOLEAN NOT NULL DEFAULT false,
    `envoyerAvis` BOOLEAN NOT NULL DEFAULT false,
    `avisEnvoye` BOOLEAN NOT NULL DEFAULT false,
    `statut` ENUM('PLANIFIEE', 'CONFIRMEE', 'EN_COURS', 'COMPLETEE', 'REPORTEE', 'ANNULEE') NOT NULL DEFAULT 'PLANIFIEE',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `planifications_commandeId_idx`(`commandeId`),
    INDEX `planifications_equipeId_idx`(`equipeId`),
    INDEX `planifications_datePlanifiee_idx`(`datePlanifiee`),
    INDEX `planifications_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productions` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `semaine` INTEGER NOT NULL,
    `annee` INTEGER NOT NULL,
    `dateProduction` DATETIME(3) NOT NULL,
    `coupe` VARCHAR(20) NULL,
    `soudure` VARCHAR(20) NULL,
    `peinture` VARCHAR(20) NULL,
    `vitrage` VARCHAR(20) NULL,
    `assemblage` VARCHAR(20) NULL,
    `controleQualite` VARCHAR(20) NULL,
    `statut` ENUM('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'EN_PAUSE') NOT NULL DEFAULT 'EN_ATTENTE',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `productions_commandeId_idx`(`commandeId`),
    INDEX `productions_semaine_annee_idx`(`semaine`, `annee`),
    INDEX `productions_dateProduction_idx`(`dateProduction`),
    INDEX `productions_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interventions` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `equipeId` VARCHAR(191) NULL,
    `responsableId` VARCHAR(191) NULL,
    `type` ENUM('INSTALLATION', 'LIVRAISON', 'CUEILLETTE', 'TRANSPORT') NOT NULL,
    `datePrevue` DATETIME(3) NOT NULL,
    `heureDebut` VARCHAR(10) NULL,
    `heureFin` VARCHAR(10) NULL,
    `statut` ENUM('PLANIFIEE', 'EN_COURS', 'COMPLETEE', 'REPORTEE', 'ANNULEE') NOT NULL DEFAULT 'PLANIFIEE',
    `heureArrivee` VARCHAR(10) NULL,
    `heureDepart` VARCHAR(10) NULL,
    `personneRessource` VARCHAR(255) NULL,
    `telephone` VARCHAR(20) NULL,
    `accessibiliteBalcon` VARCHAR(10) NULL,
    `balconEncombre` VARCHAR(10) NULL,
    `niveauBalconConforme` VARCHAR(10) NULL,
    `backingConforme` VARCHAR(10) NULL,
    `colonneCapage` VARCHAR(10) NULL,
    `noteAvant` TEXT NULL,
    `travauxNonComplete` BOOLEAN NOT NULL DEFAULT false,
    `travauxNonCompleteNote` TEXT NULL,
    `mainsInstallees` VARCHAR(10) NULL,
    `cacheVisInstallees` VARCHAR(10) NULL,
    `capsulesPoteaux` VARCHAR(10) NULL,
    `vuEnsemble` VARCHAR(10) NULL,
    `noteApres` TEXT NULL,
    `materielComplet` VARCHAR(10) NULL,
    `etatMateriel` VARCHAR(50) NULL,
    `quantiteConforme` VARCHAR(10) NULL,
    `emplacementLivraison` VARCHAR(255) NULL,
    `accessibilite` VARCHAR(10) NULL,
    `noteLivraison` TEXT NULL,
    `materielIdentifie` VARCHAR(10) NULL,
    `etatMaterielRecupere` VARCHAR(100) NULL,
    `quantiteRecuperee` INTEGER NULL,
    `emplacementCueillette` VARCHAR(255) NULL,
    `difficulteAcces` VARCHAR(10) NULL,
    `noteCueillette` TEXT NULL,
    `listeMateriels` JSON NULL,
    `adresseDepart` TEXT NULL,
    `adresseArrivee` TEXT NULL,
    `vehiculeInspecte` VARCHAR(10) NULL,
    `chargementSecurise` VARCHAR(10) NULL,
    `documentationComplete` VARCHAR(10) NULL,
    `kmDepart` INTEGER NULL,
    `kmArrivee` INTEGER NULL,
    `membresEquipe` JSON NULL,
    `materielTransporte` TEXT NULL,
    `noteTransport` TEXT NULL,
    `signatureInstallateur` LONGTEXT NULL,
    `signatureClient` LONGTEXT NULL,
    `signatureLivreur` LONGTEXT NULL,
    `signatureChauffeur` LONGTEXT NULL,
    `dateSignature` DATETIME(3) NULL,
    `formulaireComplete` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `interventions_commandeId_idx`(`commandeId`),
    INDEX `interventions_equipeId_idx`(`equipeId`),
    INDEX `interventions_responsableId_idx`(`responsableId`),
    INDEX `interventions_type_idx`(`type`),
    INDEX `interventions_datePrevue_idx`(`datePrevue`),
    INDEX `interventions_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos` (
    `id` VARCHAR(191) NOT NULL,
    `interventionId` VARCHAR(191) NOT NULL,
    `type` ENUM('AVANT', 'APRES', 'PREUVE', 'AUTRE') NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `photos_interventionId_idx`(`interventionId`),
    INDEX `photos_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achats` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(50) NOT NULL,
    `fournisseurId` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NULL,
    `typeAchat` ENUM('FIBRE', 'LIMONS', 'VERRES', 'COLONNES', 'PEINTURE', 'ATTACHES', 'PLANCHER_ALUMINIUM', 'AUTRE') NOT NULL,
    `statut` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NOT NULL DEFAULT 'A_FAIRE',
    `dateCommande` DATETIME(3) NULL,
    `datePrevue` DATETIME(3) NULL,
    `dateReception` DATETIME(3) NULL,
    `montantTotal` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `achats_numero_key`(`numero`),
    INDEX `achats_numero_idx`(`numero`),
    INDEX `achats_fournisseurId_idx`(`fournisseurId`),
    INDEX `achats_commandeId_idx`(`commandeId`),
    INDEX `achats_statut_idx`(`statut`),
    INDEX `achats_dateCommande_idx`(`dateCommande`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achat_lignes` (
    `id` VARCHAR(191) NOT NULL,
    `achatId` VARCHAR(191) NOT NULL,
    `produitId` VARCHAR(191) NOT NULL,
    `quantite` INTEGER NOT NULL,
    `quantiteRecue` INTEGER NOT NULL DEFAULT 0,
    `recu` BOOLEAN NOT NULL DEFAULT false,
    `prixUnitaire` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `achat_lignes_achatId_idx`(`achatId`),
    INDEX `achat_lignes_produitId_idx`(`produitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mouvements_stock` (
    `id` VARCHAR(191) NOT NULL,
    `produitId` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NULL,
    `type` ENUM('ENTREE', 'SORTIE', 'AJUSTEMENT', 'TRANSFERT', 'RETOUR') NOT NULL,
    `quantite` INTEGER NOT NULL,
    `quantiteAvant` INTEGER NOT NULL,
    `quantiteApres` INTEGER NOT NULL,
    `reference` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mouvements_stock_produitId_idx`(`produitId`),
    INDEX `mouvements_stock_commandeId_idx`(`commandeId`),
    INDEX `mouvements_stock_type_idx`(`type`),
    INDEX `mouvements_stock_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reprises` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `equipeId` VARCHAR(191) NULL,
    `typeReprise` ENUM('MAUVAISE_COULEUR', 'QUINCAILLERIE_MANQUANTE', 'MAIN_TROP_COURTE', 'SECTIONS_MANQUANTES', 'MAINS_MANQUANTES', 'POTEAUX_MANQUANTS', 'PIECES_GRAFIGNEES', 'ERREURS_MESURE', 'ERREURS_PRODUCTION', 'CHANGEMENT_CLIENT', 'BARRIERE', 'POTEAUX', 'DESCENTES', 'CAPSULES_MANQUANTES', 'MURS_INTIMITE', 'ERREUR_LIMON', 'VERRES', 'AUTRE') NOT NULL,
    `raison` TEXT NOT NULL,
    `dateReprise` DATETIME(3) NOT NULL,
    `dateOrigine` DATETIME(3) NULL,
    `dateCompletion` DATETIME(3) NULL,
    `nombreReprises` INTEGER NOT NULL DEFAULT 1,
    `coutEstime` DECIMAL(10, 2) NULL,
    `tempsEstime` INTEGER NULL,
    `statut` ENUM('PLANIFIEE', 'EN_COURS', 'EN_ATTENTE_PIECES', 'COMPLETEE') NOT NULL DEFAULT 'PLANIFIEE',
    `priorite` ENUM('HAUTE', 'MOYENNE', 'BASSE') NOT NULL DEFAULT 'MOYENNE',
    `responsable` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `completee` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reprises_commandeId_idx`(`commandeId`),
    INDEX `reprises_clientId_idx`(`clientId`),
    INDEX `reprises_equipeId_idx`(`equipeId`),
    INDEX `reprises_typeReprise_idx`(`typeReprise`),
    INDEX `reprises_statut_idx`(`statut`),
    INDEX `reprises_dateReprise_idx`(`dateReprise`),
    INDEX `reprises_completee_idx`(`completee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `non_conformites` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `departement` VARCHAR(100) NOT NULL,
    `dateDetection` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateResolution` DATETIME(3) NULL,
    `statut` ENUM('OUVERT', 'EN_COURS', 'RESOLU', 'FERME') NOT NULL DEFAULT 'OUVERT',
    `gravite` ENUM('MINEURE', 'MAJEURE', 'CRITIQUE') NOT NULL DEFAULT 'MINEURE',
    `actionCorrective` TEXT NULL,
    `responsable` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `non_conformites_commandeId_idx`(`commandeId`),
    INDEX `non_conformites_statut_idx`(`statut`),
    INDEX `non_conformites_gravite_idx`(`gravite`),
    INDEX `non_conformites_departement_idx`(`departement`),
    INDEX `non_conformites_dateDetection_idx`(`dateDetection`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projets_multi` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `client` VARCHAR(255) NOT NULL,
    `ville` VARCHAR(100) NOT NULL,
    `typeProjet` ENUM('COMMERCIAL', 'MULTI_PHASE') NOT NULL,
    `numCommande` VARCHAR(50) NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NULL,
    `responsable` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `statut` ENUM('EN_COURS', 'EN_PAUSE', 'COMPLETE') NOT NULL DEFAULT 'EN_COURS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `projets_multi_nom_idx`(`nom`),
    INDEX `projets_multi_client_idx`(`client`),
    INDEX `projets_multi_typeProjet_idx`(`typeProjet`),
    INDEX `projets_multi_statut_idx`(`statut`),
    INDEX `projets_multi_numCommande_idx`(`numCommande`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phases` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL,
    `dateDebut` DATETIME(3) NULL,
    `dateFin` DATETIME(3) NULL,
    `statut` ENUM('PLANIFIEE', 'EN_COURS', 'COMPLETEE') NOT NULL DEFAULT 'PLANIFIEE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `phases_projetId_idx`(`projetId`),
    INDEX `phases_ordre_idx`(`ordre`),
    INDEX `phases_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batiments` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `phaseId` VARCHAR(191) NULL,
    `nom` VARCHAR(100) NOT NULL,
    `piedsLineaires` INTEGER NOT NULL DEFAULT 0,
    `nombrePoteaux` INTEGER NOT NULL DEFAULT 0,
    `nombreBarrotins` INTEGER NOT NULL DEFAULT 0,
    `nombreVerres` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(50) NULL,
    `typeRampe` VARCHAR(100) NULL,
    `statut` ENUM('PLANIFIE', 'EN_COURS', 'COMPLETE') NOT NULL DEFAULT 'PLANIFIE',
    `dateCompletion` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `batiments_projetId_idx`(`projetId`),
    INDEX `batiments_phaseId_idx`(`phaseId`),
    INDEX `batiments_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicules` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `plaque` VARCHAR(20) NOT NULL,
    `statut` ENUM('DISPONIBLE', 'EN_ROUTE', 'MAINTENANCE') NOT NULL DEFAULT 'DISPONIBLE',
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vehicules_nom_idx`(`nom`),
    INDEX `vehicules_statut_idx`(`statut`),
    INDEX `vehicules_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chauffeurs` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `telephone` VARCHAR(20) NULL,
    `permis` VARCHAR(20) NULL,
    `statut` ENUM('ACTIF', 'EN_LIVRAISON', 'CONGE') NOT NULL DEFAULT 'ACTIF',
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chauffeurs_nom_idx`(`nom`),
    INDEX `chauffeurs_statut_idx`(`statut`),
    INDEX `chauffeurs_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('INFO', 'ALERTE', 'RAPPEL', 'URGENT') NOT NULL,
    `titre` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `lu` BOOLEAN NOT NULL DEFAULT false,
    `lien` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_lu_idx`(`lu`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attentes` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('CLIENT', 'REPRESENTANT') NOT NULL,
    `client` VARCHAR(255) NULL,
    `representant` VARCHAR(255) NULL,
    `commandeNumero` VARCHAR(50) NULL,
    `raison` TEXT NOT NULL,
    `depuis` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateResolution` DATETIME(3) NULL,
    `resolue` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attentes_type_idx`(`type`),
    INDEX `attentes_resolue_idx`(`resolue`),
    INDEX `attentes_depuis_idx`(`depuis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delais_livraison` (
    `id` VARCHAR(191) NOT NULL,
    `fournisseurId` VARCHAR(191) NOT NULL,
    `produit` VARCHAR(255) NOT NULL,
    `delaiInitial` DATETIME(3) NOT NULL,
    `nouveauDelai` DATETIME(3) NULL,
    `raison` TEXT NULL,
    `resolu` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `delais_livraison_fournisseurId_idx`(`fournisseurId`),
    INDEX `delais_livraison_resolu_idx`(`resolu`),
    INDEX `delais_livraison_delaiInitial_idx`(`delaiInitial`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `clients_nom_idx` ON `clients`(`nom`);

-- CreateIndex
CREATE INDEX `clients_type_idx` ON `clients`(`type`);

-- CreateIndex
CREATE INDEX `clients_actif_idx` ON `clients`(`actif`);

-- CreateIndex
CREATE INDEX `clients_telephone_idx` ON `clients`(`telephone`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `equipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fournisseur_produits` ADD CONSTRAINT `fournisseur_produits_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fournisseur_produits` ADD CONSTRAINT `fournisseur_produits_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `produits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commandes` ADD CONSTRAINT `commandes_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commandes` ADD CONSTRAINT `commandes_representantId_fkey` FOREIGN KEY (`representantId`) REFERENCES `representants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `balcons` ADD CONSTRAINT `balcons_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planifications` ADD CONSTRAINT `planifications_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planifications` ADD CONSTRAINT `planifications_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `equipes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productions` ADD CONSTRAINT `productions_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interventions` ADD CONSTRAINT `interventions_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interventions` ADD CONSTRAINT `interventions_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `equipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interventions` ADD CONSTRAINT `interventions_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos` ADD CONSTRAINT `photos_interventionId_fkey` FOREIGN KEY (`interventionId`) REFERENCES `interventions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achats` ADD CONSTRAINT `achats_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achats` ADD CONSTRAINT `achats_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achat_lignes` ADD CONSTRAINT `achat_lignes_achatId_fkey` FOREIGN KEY (`achatId`) REFERENCES `achats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achat_lignes` ADD CONSTRAINT `achat_lignes_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `produits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvements_stock` ADD CONSTRAINT `mouvements_stock_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `produits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvements_stock` ADD CONSTRAINT `mouvements_stock_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reprises` ADD CONSTRAINT `reprises_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reprises` ADD CONSTRAINT `reprises_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reprises` ADD CONSTRAINT `reprises_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `equipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `non_conformites` ADD CONSTRAINT `non_conformites_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phases` ADD CONSTRAINT `phases_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `projets_multi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batiments` ADD CONSTRAINT `batiments_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `projets_multi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batiments` ADD CONSTRAINT `batiments_phaseId_fkey` FOREIGN KEY (`phaseId`) REFERENCES `phases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delais_livraison` ADD CONSTRAINT `delais_livraison_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
