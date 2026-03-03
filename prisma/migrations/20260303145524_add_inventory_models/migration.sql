/*
  Warnings:

  - You are about to drop the column `unite` on the `produits` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[noTransaction]` on the table `mouvements_stock` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `produits` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `produits` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `produits_categorie_idx` ON `produits`;

-- AlterTable
ALTER TABLE `mouvements_stock` ADD COLUMN `codePiecePeinte` VARCHAR(50) NULL,
    ADD COLUMN `dateReceptionPeinture` DATETIME(3) NULL,
    ADD COLUMN `emplacement` VARCHAR(100) NULL,
    ADD COLUMN `heureTransaction` VARCHAR(10) NULL,
    ADD COLUMN `noOrdrePeinture` VARCHAR(50) NULL,
    ADD COLUMN `noTransaction` VARCHAR(50) NULL,
    ADD COLUMN `receptionTransaction` INTEGER NULL,
    MODIFY `type` ENUM('ENTREE', 'SORTIE', 'AJUSTEMENT', 'TRANSFERT', 'RETOUR', 'SORTIE_PEINTURE') NOT NULL;

-- AlterTable
ALTER TABLE `produits` DROP COLUMN `unite`,
    ADD COLUMN `achatFait` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `categoriePieceId` VARCHAR(191) NULL,
    ADD COLUMN `code` VARCHAR(50) NOT NULL,
    ADD COLUMN `codePieceNonPeinte` VARCHAR(50) NULL,
    ADD COLUMN `couleur` VARCHAR(50) NULL,
    ADD COLUMN `dateDerniereTransaction` DATETIME(3) NULL,
    ADD COLUMN `emplacement2` VARCHAR(100) NULL,
    ADD COLUMN `fournisseurId` VARCHAR(191) NULL,
    ADD COLUMN `inventaireEmplacement1` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `inventaireEmplacement2` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `partiPeinture` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `piecePeinte` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `uniteId` VARCHAR(191) NULL,
    ADD COLUMN `uniteLegacy` VARCHAR(50) NULL,
    MODIFY `categorie` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `categories_piece` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_piece_nom_key`(`nom`),
    INDEX `categories_piece_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unites` (
    `id` VARCHAR(191) NOT NULL,
    `unite` VARCHAR(50) NOT NULL,
    `qtePar` INTEGER NOT NULL DEFAULT 1,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `unites_unite_key`(`unite`),
    INDEX `unites_unite_idx`(`unite`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `mouvements_stock_noTransaction_key` ON `mouvements_stock`(`noTransaction`);

-- CreateIndex
CREATE INDEX `mouvements_stock_noTransaction_idx` ON `mouvements_stock`(`noTransaction`);

-- CreateIndex
CREATE UNIQUE INDEX `produits_code_key` ON `produits`(`code`);

-- CreateIndex
CREATE INDEX `produits_code_idx` ON `produits`(`code`);

-- CreateIndex
CREATE INDEX `produits_categoriePieceId_idx` ON `produits`(`categoriePieceId`);

-- CreateIndex
CREATE INDEX `produits_uniteId_idx` ON `produits`(`uniteId`);

-- CreateIndex
CREATE INDEX `produits_fournisseurId_idx` ON `produits`(`fournisseurId`);

-- AddForeignKey
ALTER TABLE `produits` ADD CONSTRAINT `produits_categoriePieceId_fkey` FOREIGN KEY (`categoriePieceId`) REFERENCES `categories_piece`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produits` ADD CONSTRAINT `produits_uniteId_fkey` FOREIGN KEY (`uniteId`) REFERENCES `unites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produits` ADD CONSTRAINT `produits_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
