-- CreateTable
CREATE TABLE `commissions` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `representantId` VARCHAR(191) NOT NULL,
    `montantSoumission` DECIMAL(10, 2) NOT NULL,
    `pourcentage` DOUBLE NOT NULL,
    `montantCommission` DECIMAL(10, 2) NOT NULL,
    `statut` ENUM('EN_ATTENTE', 'CALCULEE', 'PAYEE', 'ANNULEE') NOT NULL DEFAULT 'EN_ATTENTE',
    `typeCommission` ENUM('SOUMISSION', 'VENTE', 'INSTALLATION') NOT NULL DEFAULT 'SOUMISSION',
    `paye` BOOLEAN NOT NULL DEFAULT false,
    `datePaiement` DATETIME(3) NULL,
    `numeroFacture` VARCHAR(50) NULL,
    `depotGarantie` DECIMAL(10, 2) NULL,
    `motifDeficience` TEXT NULL,
    `notes` TEXT NULL,
    `dateSoumission` DATETIME(3) NOT NULL,
    `dateCalcul` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `commissions_commandeId_key`(`commandeId`),
    INDEX `commissions_commandeId_idx`(`commandeId`),
    INDEX `commissions_representantId_idx`(`representantId`),
    INDEX `commissions_statut_idx`(`statut`),
    INDEX `commissions_paye_idx`(`paye`),
    INDEX `commissions_dateSoumission_idx`(`dateSoumission`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deficiences_commission` (
    `id` VARCHAR(191) NOT NULL,
    `commissionId` VARCHAR(191) NOT NULL,
    `type` ENUM('MESURES', 'VENTES', 'FABRICATION', 'FOURNISSEUR', 'INSTALLATION', 'PRODUCTION', 'LIVRAISON', 'CLIENT', 'MULTIPLE', 'PRODUIT', 'AUTRE') NOT NULL,
    `secteur` ENUM('ANNULE_REPRESENTANT', 'SAUTE_ERREUR', 'SERVICE_APRES_VENTE', 'DEMANDE_PRISE_MESURES') NULL,
    `description` TEXT NOT NULL,
    `raison` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `deficiences_commission_commissionId_key`(`commissionId`),
    INDEX `deficiences_commission_commissionId_idx`(`commissionId`),
    INDEX `deficiences_commission_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_representantId_fkey` FOREIGN KEY (`representantId`) REFERENCES `representants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deficiences_commission` ADD CONSTRAINT `deficiences_commission_commissionId_fkey` FOREIGN KEY (`commissionId`) REFERENCES `commissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
