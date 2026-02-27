/*
  Warnings:

  - You are about to drop the column `commandeIds` on the `envois_attente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `envois_attente` DROP COLUMN `commandeIds`;

-- CreateTable
CREATE TABLE `_CommandeEnvois` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CommandeEnvois_AB_unique`(`A`, `B`),
    INDEX `_CommandeEnvois_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_CommandeEnvois` ADD CONSTRAINT `_CommandeEnvois_A_fkey` FOREIGN KEY (`A`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CommandeEnvois` ADD CONSTRAINT `_CommandeEnvois_B_fkey` FOREIGN KEY (`B`) REFERENCES `envois_attente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
