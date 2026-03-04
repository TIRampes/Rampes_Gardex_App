-- AlterTable
ALTER TABLE `commandes` ADD COLUMN `attenteEnvoyee` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `dateDernierEnvoiAttente` DATETIME(3) NULL;
