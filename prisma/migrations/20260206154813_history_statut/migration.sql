-- CreateTable
CREATE TABLE `historique_statuts` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `ancienStatut` ENUM('ACTIVE', 'EN_ATTENTE', 'COMPLETEE', 'ANNULEE') NOT NULL,
    `nouveauStatut` ENUM('ACTIVE', 'EN_ATTENTE', 'COMPLETEE', 'ANNULEE') NOT NULL,
    `dateChangement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `commentaire` TEXT NULL,

    INDEX `historique_statuts_commandeId_idx`(`commandeId`),
    INDEX `historique_statuts_dateChangement_idx`(`dateChangement`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `historique_statuts` ADD CONSTRAINT `historique_statuts_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
