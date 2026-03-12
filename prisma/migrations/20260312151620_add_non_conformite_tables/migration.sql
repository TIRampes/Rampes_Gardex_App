/*
  Warnings:

  - You are about to drop the column `departement` on the `non_conformites` table. All the data in the column will be lost.
  - You are about to drop the column `responsable` on the `non_conformites` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `non_conformites` DROP FOREIGN KEY `non_conformites_commandeId_fkey`;

-- DropIndex
DROP INDEX `non_conformites_departement_idx` ON `non_conformites`;

-- AlterTable
ALTER TABLE `non_conformites` DROP COLUMN `departement`,
    DROP COLUMN `responsable`,
    ADD COLUMN `confirmation` BOOLEAN NULL,
    ADD COLUMN `correction` TEXT NULL,
    ADD COLUMN `dateCorrection` DATETIME(3) NULL,
    ADD COLUMN `departementId` VARCHAR(191) NULL,
    ADD COLUMN `departementTexte` VARCHAR(100) NULL,
    ADD COLUMN `envoiMail` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mesureCorrective` TEXT NULL,
    ADD COLUMN `noProjet` VARCHAR(50) NULL,
    ADD COLUMN `responsableId` VARCHAR(191) NULL,
    ADD COLUMN `responsableTexte` VARCHAR(255) NULL,
    ADD COLUMN `typeId` VARCHAR(191) NULL,
    MODIFY `commandeId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `DepartementNC` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DepartementNC_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TypeNC` (
    `id` VARCHAR(191) NOT NULL,
    `departementId` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResponsableNC` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `non_conformites_noProjet_idx` ON `non_conformites`(`noProjet`);

-- CreateIndex
CREATE INDEX `non_conformites_departementId_idx` ON `non_conformites`(`departementId`);

-- CreateIndex
CREATE INDEX `non_conformites_typeId_idx` ON `non_conformites`(`typeId`);

-- CreateIndex
CREATE INDEX `non_conformites_responsableId_idx` ON `non_conformites`(`responsableId`);

-- AddForeignKey
ALTER TABLE `non_conformites` ADD CONSTRAINT `non_conformites_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `non_conformites` ADD CONSTRAINT `non_conformites_departementId_fkey` FOREIGN KEY (`departementId`) REFERENCES `DepartementNC`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `non_conformites` ADD CONSTRAINT `non_conformites_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `TypeNC`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `non_conformites` ADD CONSTRAINT `non_conformites_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `ResponsableNC`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TypeNC` ADD CONSTRAINT `TypeNC_departementId_fkey` FOREIGN KEY (`departementId`) REFERENCES `DepartementNC`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
