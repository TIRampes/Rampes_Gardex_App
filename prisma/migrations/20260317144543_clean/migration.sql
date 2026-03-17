/*
  Warnings:

  - You are about to alter the column `service` on the `commandes` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(23))` to `Enum(EnumId(4))`.

*/
-- DropForeignKey
ALTER TABLE `planifications` DROP FOREIGN KEY `planifications_equipeId_fkey`;

-- AlterTable
ALTER TABLE `commandes` MODIFY `typeCommande` ENUM('STANDARD', 'COMMERCIAL', 'MULTI_PHASE', 'MULTIPLAN', 'MESURE') NOT NULL DEFAULT 'STANDARD',
    MODIFY `service` ENUM('INSTALLATION', 'LIVRAISON', 'CUEILLETTE', 'TRANSPORT') NOT NULL DEFAULT 'INSTALLATION';

-- AlterTable
ALTER TABLE `equipe_heure_semaines` MODIFY `semaineDu` DATETIME(3) NOT NULL,
    MODIFY `semaineFin` DATETIME(3) NOT NULL;

-- AddForeignKey
ALTER TABLE `planifications` ADD CONSTRAINT `planifications_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `equipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
