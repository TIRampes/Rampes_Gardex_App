/*
  Warnings:

  - The values [STANDARD,COMMERCIAL,MULTI_PHASE,MULTIPLAN] on the enum `envois_attente_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,EN_ATTENTE,COMPLETEE,ANNULEE] on the enum `envois_attente_statut` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `envois_attente` MODIFY `type` ENUM('INDIVIDUEL', 'GROUPE', 'AUTOMATIQUE') NOT NULL,
    MODIFY `statut` ENUM('ENVOYE', 'ERREUR', 'EN_COURS') NOT NULL;
