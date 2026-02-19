/*
  Warnings:

  - You are about to drop the column `activite` on the `commandes` table. All the data in the column will be lost.
  - You are about to drop the column `livraison` on the `commandes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `achats` ADD COLUMN `dateEnvoie` DATETIME(3) NULL,
    ADD COLUMN `quantiteNonRecue` INTEGER NULL;

-- AlterTable
ALTER TABLE `commandes` DROP COLUMN `activite`,
    DROP COLUMN `livraison`,
    ADD COLUMN `ancienneCommandeNumero` VARCHAR(50) NULL,
    ADD COLUMN `commentaireAdresse` TEXT NULL,
    ADD COLUMN `dateEnvoieAttaches` DATETIME(3) NULL,
    ADD COLUMN `dateEnvoieColonnes` DATETIME(3) NULL,
    ADD COLUMN `dateEnvoieFibre` DATETIME(3) NULL,
    ADD COLUMN `dateEnvoieLimons` DATETIME(3) NULL,
    ADD COLUMN `dateEnvoiePeinture` DATETIME(3) NULL,
    ADD COLUMN `dateEnvoiePlancherAluminium` DATETIME(3) NULL,
    ADD COLUMN `dateEnvoieVerres` DATETIME(3) NULL,
    ADD COLUMN `piedsLineairesBarrotin` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `piedsLineairesGardexOptimum` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `piedsLineairesGardexUrbaine` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `piedsLineairesGardexVision` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `piedsLineairesMainDouble` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `piedsLineairesMur` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `piedsLineairesVerre` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `quantiteNonRecueAttaches` INTEGER NULL,
    ADD COLUMN `quantiteNonRecueColonnes` INTEGER NULL,
    ADD COLUMN `quantiteNonRecueFibre` INTEGER NULL,
    ADD COLUMN `quantiteNonRecueLimons` INTEGER NULL,
    ADD COLUMN `quantiteNonRecuePeinture` INTEGER NULL,
    ADD COLUMN `quantiteNonRecuePlancherAluminium` INTEGER NULL,
    ADD COLUMN `quantiteNonRecueVerres` INTEGER NULL,
    ADD COLUMN `semainePrevue` VARCHAR(10) NULL,
    ADD COLUMN `statutLivraison` VARCHAR(20) NULL DEFAULT 'N_A',
    ADD COLUMN `tempsInstallationAuto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `utiliserCalculAuto` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `structures_achat` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `statutAchat` ENUM('A_FAIRE', 'FAIT', 'RECEPTIONNE', 'PRET_A_RAMASSER', 'BACK_ORDER') NOT NULL DEFAULT 'A_FAIRE',
    `dateEnvoie` DATETIME(3) NULL,
    `dateReception` DATETIME(3) NULL,
    `quantiteNonRecue` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `structures_achat_commandeId_idx`(`commandeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `commandes_reprise_idx` ON `commandes`(`reprise`);

-- AddForeignKey
ALTER TABLE `structures_achat` ADD CONSTRAINT `structures_achat_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
