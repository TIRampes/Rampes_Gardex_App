/*
  Warnings:

  - The values [MESURE] on the enum `commandes_service` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `couleur` on the `commandes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(6))`.
  - Made the column `statutLivraison` on table `commandes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `commandes` ADD COLUMN `couleurPersonnalisee` VARCHAR(50) NULL,
    ADD COLUMN `installation` ENUM('COMPLETE', 'ATTENTE_CLIENT', 'NON_APPLICABLE', 'PARTIEL', 'DOSSIER_MESUREUR', 'MODIFICATION', 'ATTENTE_CAROL_CONFIRM', 'ATTENTE_CAROL_MESURE', 'BACK_ORDER', 'ATTENTE_REPRESENTANT') NULL,
    MODIFY `service` ENUM('INSTALLATION', 'LIVRAISON', 'CUEILLETTE', 'TRANSPORT') NOT NULL DEFAULT 'INSTALLATION',
    MODIFY `couleur` ENUM('NOIR', 'BLANC', 'BRUN_COMMERCIALE', 'GRIS_CHARBON', 'ARGILE', 'SPECIALE', 'GRIS_METALLIQUE', 'AUTRE') NULL,
    MODIFY `statutLivraison` ENUM('N_A', 'LIVRE') NOT NULL DEFAULT 'N_A';

-- CreateTable
CREATE TABLE `configurations` (
    `id` VARCHAR(191) NOT NULL,
    `cle` VARCHAR(100) NOT NULL,
    `valeur` TEXT NOT NULL,
    `description` TEXT NULL,
    `modifiable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configurations_cle_key`(`cle`),
    INDEX `configurations_cle_idx`(`cle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
