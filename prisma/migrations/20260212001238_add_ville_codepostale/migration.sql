/*
  Warnings:

  - You are about to drop the column `personne_Contact` on the `clients` table. All the data in the column will be lost.
  - Added the required column `contact` to the `clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `clients` DROP COLUMN `personne_Contact`,
    ADD COLUMN `codePostal` VARCHAR(20) NULL,
    ADD COLUMN `contact` VARCHAR(255) NOT NULL,
    ADD COLUMN `ville` VARCHAR(100) NULL;
