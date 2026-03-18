-- AlterTable
ALTER TABLE `users` ADD COLUMN `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mfaSecret` VARCHAR(255) NULL;
