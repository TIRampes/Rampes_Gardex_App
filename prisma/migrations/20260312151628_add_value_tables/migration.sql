-- ================================================
-- MIGRATION: Planification V2
-- Ajouter: responsable et nbHeuresJour sur Equipe
-- Ajouter: EquipeHeureSemaine
-- Modifier: Planification (equipeId nullable, chauffeurId, vehiculeId)
-- Ajouter: MESURE à ServiceCommande
-- ================================================

-- 1. Ajouter MESURE au enum ServiceCommande
ALTER TABLE `commandes` MODIFY COLUMN `service` ENUM('INSTALLATION','LIVRAISON','CUEILLETTE','TRANSPORT','MESURE') NOT NULL;

-- 2. Ajouter champs à Equipe
ALTER TABLE `equipes` ADD COLUMN `responsable` VARCHAR(255) NULL;
ALTER TABLE `equipes` ADD COLUMN `nbHeuresJour` INT NULL DEFAULT 8;

-- 3. Créer la table EquipeHeureSemaine
CREATE TABLE `equipe_heure_semaines` (
  `id` VARCHAR(191) NOT NULL,
  `equipeId` VARCHAR(191) NOT NULL,
  `semaineDu` DATE NOT NULL,
  `semaineFin` DATE NOT NULL,
  `jours` INT NOT NULL DEFAULT 5,
  `heures` INT NOT NULL DEFAULT 40,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `equipe_heure_semaines_equipeId_idx`(`equipeId`),
  INDEX `equipe_heure_semaines_semaineDu_idx`(`semaineDu`),
  CONSTRAINT `equipe_heure_semaines_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `equipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Modifier Planification: equipeId nullable + ajout chauffeurId/vehiculeId
ALTER TABLE `planifications` MODIFY COLUMN `equipeId` VARCHAR(191) NULL;
ALTER TABLE `planifications` ADD COLUMN `chauffeurId` VARCHAR(191) NULL;
ALTER TABLE `planifications` ADD COLUMN `vehiculeId` VARCHAR(191) NULL;
ALTER TABLE `planifications` ADD COLUMN `avisClientEnvoye` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `planifications` ADD COLUMN `avisClientDate` DATETIME(3) NULL;
ALTER TABLE `planifications` ADD INDEX `planifications_chauffeurId_idx`(`chauffeurId`);
ALTER TABLE `planifications` ADD INDEX `planifications_vehiculeId_idx`(`vehiculeId`);
ALTER TABLE `planifications` ADD CONSTRAINT `planifications_chauffeurId_fkey` FOREIGN KEY (`chauffeurId`) REFERENCES `chauffeurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `planifications` ADD CONSTRAINT `planifications_vehiculeId_fkey` FOREIGN KEY (`vehiculeId`) REFERENCES `vehicules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Configurer les heures de travail globales (continu/régulier)
INSERT INTO `configurations` (`id`, `cle`, `valeur`, `description`, `modifiable`, `createdAt`, `updatedAt`)
VALUES
  (UUID(), 'heures_travail_continu', '38', 'Nombre heures travail continu par semaine', true, NOW(), NOW()),
  (UUID(), 'heures_travail_regulier', '30', 'Nombre heures travail régulier par semaine', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updatedAt` = NOW();